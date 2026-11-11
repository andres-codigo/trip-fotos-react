import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

import { suiteSpecs } from './spec-results.mjs'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const bin = (name) => path.join(projectDir, 'node_modules', '.bin', name)

// Its own port, so a developer's Vite server on 3000 never blocks the run or gets reused; E2E_PORT overrides it
const PORT = Number(process.env.E2E_PORT) || 5190
const STARTUP_TIMEOUT_MS = 60_000
// Never dist/, which the Build gate writes at the same time
const OUT_DIR = path.join(projectDir, 'node_modules', '.cache', 'e2e-build')

// A production build served by `vite preview`: each visit loads a few bundled chunks, not hundreds of dev modules. Emulator runs build in `emulators` mode, which loads .env.emulators and turns the emulator connection on
export const serverSteps = ({
	useEmulators,
	port = PORT,
	outDir = OUT_DIR,
}) => {
	const mode = useEmulators ? ['--mode', 'emulators'] : []
	return {
		build: ['build', ...mode, '--outDir', outDir, '--emptyOutDir'],
		preview: [
			'preview',
			...mode,
			'--outDir',
			outDir,
			'--port',
			String(port),
			'--strictPort',
		],
	}
}

// E2E_SPEC (comma-separated) reaches Cypress through `firebase emulators:exec`, which passes no arguments on; /verify sets it to rerun only failed specs
export const cypressArgs = (args, spec = process.env.E2E_SPEC) => [
	'run',
	'--e2e',
	...(spec ? ['--spec', spec] : []),
	...args,
]

const split = (list) =>
	String(list ?? '')
		.split(',')
		.map((spec) => spec.trim())
		.filter(Boolean)

// E2E_SPEC_FIRST (set by /verify to the specs for the changed pages) runs as its own batch before the rest, so a real failure shows in the first minute or two; null runs the whole suite
export const specBatches = ({ first, spec, suite }) => {
	const scope = split(spec).length ? split(spec) : suite
	const head = split(first).filter((name) => scope.includes(name))
	const rest = scope.filter((name) => !head.includes(name))
	if (!head.length || !rest.length) return [split(spec).join(',') || null]
	return [head.join(','), rest.join(',')]
}

// Lines after which every later Storage or Database call hangs until its timeout, so the run stops at once
const FATAL_EMULATOR_LINES = [
	/Unexpected rules runtime error/,
	/Emulator has exited/,
]

export const fatalLine = (text) =>
	text
		.split('\n')
		.find((line) => FATAL_EMULATOR_LINES.some((fatal) => fatal.test(line)))
		?.trim() ?? null

const LOG_FILE = /^firebase-debug(\.\d+)?\.log$/

// The emulators log to firebase-debug.log in the project (a numbered one when another firebase command holds it). Reads only what is written after the watch starts
export const watchEmulatorLogs = ({ dir, onFatal, interval = 500 }) => {
	const logs = () => fs.readdirSync(dir).filter((name) => LOG_FILE.test(name))
	const size = (name) => fs.statSync(path.join(dir, name)).size
	const offsets = new Map(logs().map((name) => [name, size(name)]))
	const check = () => {
		for (const name of logs()) {
			const end = size(name)
			const start = offsets.get(name) ?? 0
			offsets.set(name, end)
			if (end <= start) continue
			const buffer = Buffer.alloc(end - start)
			const fd = fs.openSync(path.join(dir, name), 'r')
			fs.readSync(fd, buffer, 0, buffer.length, start)
			fs.closeSync(fd)
			const line = fatalLine(buffer.toString('utf8'))
			if (line) {
				clearInterval(timer)
				onFatal(line)
				return
			}
		}
	}
	const timer = setInterval(check, interval)
	return () => clearInterval(timer)
}

const isUp = (url) =>
	new Promise((resolve) => {
		const client = url.startsWith('https') ? https : http
		const request = client.get(
			url,
			// The optional local dev cert is self-signed
			{ rejectUnauthorized: false, timeout: 2000 },
			(response) => {
				response.resume()
				resolve(true)
			},
		)
		request.on('error', () => resolve(false))
		request.on('timeout', () => request.destroy())
	})

const findRunningServer = async () => {
	for (const url of [
		`http://localhost:${PORT}`,
		`https://localhost:${PORT}`,
	]) {
		if (await isUp(url)) return url
	}
	return null
}

const waitForServer = async (url) => {
	const deadline = Date.now() + STARTUP_TIMEOUT_MS
	while (Date.now() < deadline) {
		if (await isUp(url)) return true
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
	return false
}

const main = async () => {
	// Emulator runs need a build in `emulators` mode, so never reuse whatever is on the port
	const useEmulators = process.env.E2E_EMULATORS === 'true'
	// CYPRESS=true makes vite.config.js skip HTTPS and the preview's browser tab, matching CI
	const env = { ...process.env, CYPRESS: 'true' }
	let server = null

	const stopServer = () => {
		if (!server) return
		// Negative PID kills the whole detached group, including Vite's children
		try {
			process.kill(-server.pid, 'SIGTERM')
		} catch {
			// Already exited
		}
		server = null
	}

	process.on('SIGINT', () => {
		stopServer()
		process.exit(130)
	})

	let baseUrl = useEmulators ? null : await findRunningServer()

	if (baseUrl) {
		console.log(`Reusing server already running at ${baseUrl}`)
	} else {
		baseUrl = `http://localhost:${PORT}`
		const steps = serverSteps({ useEmulators })
		console.log('Building the app for E2E...')
		const build = spawnSync(bin('vite'), steps.build, {
			cwd: projectDir,
			env,
			stdio: 'inherit',
		})
		if (build.status !== 0) {
			console.error('The E2E build failed')
			process.exit(1)
		}
		console.log(`Serving the build at ${baseUrl}...`)
		server = spawn(bin('vite'), steps.preview, {
			cwd: projectDir,
			env,
			detached: true,
			stdio: 'ignore',
		})

		if (!(await waitForServer(baseUrl))) {
			console.error(
				`Preview server did not respond within ${STARTUP_TIMEOUT_MS / 1000}s`,
			)
			stopServer()
			process.exit(1)
		}
	}

	let cypress = null
	const stopWatching = useEmulators
		? watchEmulatorLogs({
				dir: projectDir,
				onFatal: (line) => {
					console.error(
						`\nThe emulators crashed, so every later call would hang: ${line}\nRestart the emulators (or rerun) and look at firebase-debug.log.`,
					)
					cypress?.kill('SIGTERM')
					stopServer()
					process.exit(1)
				},
			})
		: () => {}

	const runCypress = (spec) =>
		new Promise((resolve) => {
			cypress = spawn(
				bin('cypress'),
				cypressArgs(process.argv.slice(2), spec ?? undefined),
				{
					cwd: projectDir,
					env: { ...process.env, VITE_ROOT_URL: baseUrl },
					stdio: 'inherit',
				},
			)
			cypress.on('exit', (code) => resolve(code ?? 1))
		})

	const batches = specBatches({
		first: process.env.E2E_SPEC_FIRST,
		spec: process.env.E2E_SPEC,
		suite: suiteSpecs('e2e', projectDir),
	})
	let code = 0
	for (const [index, spec] of batches.entries()) {
		if (batches.length > 1) {
			console.log(
				index === 0
					? `Running the specs for the changed pages first: ${spec}`
					: 'The affected specs passed; running the rest',
			)
		}
		code = await runCypress(spec)
		if (code !== 0) break
	}
	stopWatching()
	stopServer()
	process.exit(code)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
