import { spawn } from 'node:child_process'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const bin = (name) => path.join(projectDir, 'node_modules', '.bin', name)
const cypressArgs = process.argv.slice(2)

const PORT = 3000
const STARTUP_TIMEOUT_MS = 60_000

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

let baseUrl = await findRunningServer()

if (baseUrl) {
	console.log(`Reusing dev server already running at ${baseUrl}`)
} else {
	baseUrl = `http://localhost:${PORT}`
	console.log(`Starting dev server at ${baseUrl}...`)
	// CYPRESS=true makes vite.config.js skip HTTPS, matching CI
	server = spawn(bin('vite'), ['--port', String(PORT), '--strictPort'], {
		cwd: projectDir,
		env: { ...process.env, CYPRESS: 'true' },
		detached: true,
		stdio: 'ignore',
	})

	if (!(await waitForServer(baseUrl))) {
		console.error(
			`Dev server did not respond within ${STARTUP_TIMEOUT_MS / 1000}s`,
		)
		stopServer()
		process.exit(1)
	}
}

const cypress = spawn(bin('cypress'), ['run', '--e2e', ...cypressArgs], {
	cwd: projectDir,
	env: { ...process.env, VITE_ROOT_URL: baseUrl },
	stdio: 'inherit',
})

cypress.on('exit', (code) => {
	stopServer()
	process.exit(code ?? 1)
})
