import { spawn, spawnSync } from 'node:child_process'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

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

	const cypress = spawn(bin('cypress'), cypressArgs(process.argv.slice(2)), {
		cwd: projectDir,
		env: { ...process.env, VITE_ROOT_URL: baseUrl },
		stdio: 'inherit',
	})

	cypress.on('exit', (code) => {
		stopServer()
		process.exit(code ?? 1)
	})
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
