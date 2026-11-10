// Runs the /verify gates and prints the pass/fail table: node verify.mjs [e2e] [all]
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'

import { gateHolds, planGates, uiCheckGap } from './changed-gates.mjs'
import { branchFiles, changedSince, treeHash } from './git-tree.mjs'
import { resetChecks } from './reset-checks.mjs'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
// node_modules is gitignored and shared by every worktree that links it, so the cache survives branch switches
const cacheDir = path.join(projectDir, 'node_modules', '.cache', 'verify')
const cacheFile = path.join(cacheDir, 'passed.json')
// Read by the status line to show whether a run is in flight and how the last one ended
const statusFile = path.join(cacheDir, 'status.json')
// Written by .claude/skills/ui-check/status.mjs
const uiStatusFile = path.join(
	projectDir,
	'node_modules',
	'.cache',
	'ui-check',
	'status.json',
)

// Auth, Realtime Database, Storage and the Emulator UI (firebase.json)
export const EMULATOR_PORTS = [9099, 9000, 9199, 4000]

const GATES = {
	lint: {
		name: 'ESLint',
		command: 'npm run lint',
		summary: /(\d+ problems?.*)/,
		// ESLint prints the file path, then indented line:column entries under it
		failure: /^\/\S+\.\w+$|^\s*\d+:\d+\s+(error|warning)/,
	},
	vitest: {
		name: 'Vitest',
		command: 'npm run vitest:run',
		summary: /Tests\s+(.*)/,
		failure: /FAIL|AssertionError|Error:|❯ \S+:\d+:\d+/,
	},
	ct: {
		name: 'Cypress component tests',
		command: 'npm run cy:run:ct',
		summary: /(All specs passed!.*|\d+ of \d+ failed.*)/,
		failure: /^\s*\d+\) |AssertionError|Error:|✖/,
	},
	build: {
		name: 'Build',
		command: 'npm run build',
		summary: /(built in .*)/,
		failure: /error|Error/,
	},
	yaml: {
		name: 'Workflow YAML',
		command: "npx prettier --check '.github/**/*.{yml,yaml}'",
		summary: /(All matched files.*)/,
		failure: /\[(warn|error)\]/,
	},
	e2e: {
		name: 'Cypress E2E',
		command: 'npm run cy:run:e2e:emulators',
		summary: /(All specs passed!.*|\d+ of \d+ failed.*)/,
		failure: /^\s*\d+\) |AssertionError|Error:|✖|ECONNREFUSED/,
	},
}

const MAX_FAILURE_LINES = 20

const readJson = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch {
		return {}
	}
}

const isAlive = (pid) => {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

const portInUse = (port) =>
	new Promise((resolve) => {
		const socket = net.connect({ port, host: '127.0.0.1' })
		socket.setTimeout(500)
		socket.once('connect', () => resolve(socket.destroy() || true))
		socket.once('timeout', () => resolve(socket.destroy() && false))
		socket.once('error', () => resolve(false))
	})

// Another /verify, the emulators or a Cypress run (such as a /ui-check capture) would clash over ports and the screenshots folder
export const findClash = async ({
	status = readJson(statusFile),
	alive = isAlive,
	inUse = portInUse,
	cypressRunning = () =>
		spawnSync('pgrep', ['-f', 'cypress run|Cypress']).status === 0,
} = {}) => {
	if (status.state === 'running' && status.pid && alive(status.pid))
		return `another /verify is running (pid ${status.pid})`
	const busy = []
	for (const port of EMULATOR_PORTS) if (await inUse(port)) busy.push(port)
	if (busy.length)
		return `emulator ports in use (${busy.join(', ')}): stop the emulators first`
	if (cypressRunning())
		return 'a Cypress run is in progress (for example a /ui-check capture)'
	return null
}

const runGate = (gate) => {
	const { command, summary, failure } = GATES[gate]
	const result = spawnSync(command, {
		cwd: projectDir,
		shell: true,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	})
	// Colour codes would stop the summary and failure patterns matching
	const output = stripVTControlCharacters(
		`${result.stdout}\n${result.stderr}`,
	)
	const log = path.join(cacheDir, `${gate}.log`)
	fs.writeFileSync(log, output)
	const lines = output.split('\n')
	return {
		status: result.status,
		summary:
			lines.map((line) => line.match(summary)?.[1]).findLast(Boolean) ??
			'',
		errors: lines
			.filter((line) => failure.test(line))
			.slice(0, MAX_FAILURE_LINES)
			.map((line) => line.trim()),
		log,
	}
}

const main = async () => {
	const args = process.argv.slice(2)
	const all = args.includes('all')

	const clash = await findClash()
	if (clash) {
		console.log(`/verify not started: ${clash}.`)
		process.exit(3)
	}

	const files = branchFiles(projectDir)
	const tree = treeHash(projectDir)
	const uiGap = uiCheckGap(files, {
		tree,
		uiStatus: readJson(uiStatusFile),
		changedSince: changedSince(projectDir, tree),
	})
	if (uiGap) {
		console.log(`/verify not started: ${uiGap}.`)
		process.exit(3)
	}

	const { runArgs, reasons } = planGates(files, {
		e2e: args.includes('e2e'),
		all,
	})
	if (!runArgs.length) {
		console.log(
			'Nothing /verify checks has changed (docs, Markdown or JSON only).',
		)
		return
	}

	resetChecks(projectDir, { uiCheck: false })
	fs.mkdirSync(cacheDir, { recursive: true })
	const cache = { gates: readJson(cacheFile).gates ?? {} }
	const holds = { tree, cache, changedSince: changedSince(projectDir, tree) }
	const writeStatus = (state) =>
		fs.writeFileSync(
			statusFile,
			JSON.stringify({
				state,
				pid: process.pid,
				tree,
				updated: Date.now(),
			}),
		)
	writeStatus('running')

	const rows = []
	const failures = []
	for (const gate of runArgs) {
		if (!all && gateHolds(gate, holds)) {
			rows.push([gate, '✅ cached', 'no change since it last passed'])
			continue
		}
		const result = runGate(gate)
		// ESLint exits 2 when it cannot run at all; never report the other gates on top of a broken config
		if (gate === 'lint' && result.status === 2) {
			writeStatus('fail')
			console.log(
				'ESLint could not run (exit 2); no other gate was started.',
			)
			result.errors.forEach((line) => console.log(`  ${line}`))
			console.log(`  full log: ${result.log}`)
			process.exit(1)
		}
		if (result.status === 0) {
			cache.gates[gate] = tree
			rows.push([gate, '✅', result.summary])
		} else {
			rows.push([gate, '❌', result.summary || `exit ${result.status}`])
			failures.push([gate, result])
		}
		fs.writeFileSync(cacheFile, JSON.stringify(cache, null, '\t'))
	}

	const passed = failures.length === 0
	writeStatus(passed ? 'pass' : 'fail')

	const table = [
		'| Gate | Result | Notes |',
		'| ---- | ------ | ----- |',
		...Object.keys(GATES)
			.filter((gate) => gate !== 'e2e' || runArgs.includes('e2e'))
			.map((gate) => {
				const [, result, notes] = rows.find(
					([name]) => name === gate,
				) ?? [gate, '⏭ skipped', '']
				const note =
					gate === 'e2e' && reasons.length
						? `ran: ${reasons.join('; ')}${notes ? `; ${notes}` : ''}`
						: notes
				return `| ${GATES[gate].name} | ${result} | ${note} |`
			}),
	]
	console.log(table.join('\n'))

	for (const [gate, { errors, log }] of failures) {
		console.log(`\n${GATES[gate].name} failed:`)
		errors.forEach((line) => console.log(`  ${line}`))
		console.log(`  full log: ${log}`)
	}

	if (treeHash(projectDir) !== tree)
		console.log(
			'\nThe code changed during the run: this result is for the earlier tree. Run /verify again.',
		)

	process.exit(passed ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
