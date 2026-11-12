// Runs the /verify gates and prints the pass/fail table: node verify.mjs [e2e] [all]
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'

import { affectedSpecs } from '../../../cypress/impact.js'
import {
	gateHolds,
	gatesForFile,
	planGates,
	uiCheckGap,
} from './changed-gates.mjs'
import { branchFiles, changedSince, treeHash } from './git-tree.mjs'
import { resetChecks } from './reset-checks.mjs'
import {
	isSpecGate,
	passedSpecs,
	readSpecResults,
	specsToRun,
	suiteSpecs,
} from './spec-results.mjs'

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
// node_modules is gitignored and shared by every worktree that links it, so the cache survives branch switches
const cacheDir = path.join(projectDir, 'node_modules', '.cache', 'verify')
const cacheFile = path.join(cacheDir, 'passed.json')
// The Cypress specs that passed on a tree whose gate run failed
const specsFile = path.join(cacheDir, 'specs.json')
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
		// Only the specs still to pass on this tree
		withSpecs: (specs) =>
			`npm run cy:run:ct -- --spec '${specs.join(',')}'`,
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
		// `emulators:exec` passes no arguments on, so run-e2e.mjs reads the specs from E2E_SPEC
		withSpecs: (specs) =>
			`E2E_SPEC='${specs.join(',')}' npm run cy:run:e2e:emulators`,
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

// The Cypress gates share the screenshots folder, so they never overlap
const SERIAL = ['ct', 'e2e']

// Starts each gate through `start(gate)` (a promise of its result). This container is I/O-bound: the fast gates in parallel save only seconds over running in turn, and alongside the component tests they slow that gate by minutes. So they run alongside E2E, which mostly waits on the emulators, or, with no E2E, together before the component tests. `stopOthers` runs when ESLint exits 2, as nothing else is worth reporting then, and no gate starts after it
export const scheduleGates = async (gates, start, stopOthers) => {
	const results = {}
	let stopped = false
	const run = async (gate) => {
		if (stopped) return
		results[gate] = await start(gate)
		if (gate === 'lint' && results[gate].status === 2) {
			stopped = true
			stopOthers()
		}
	}
	const fast = gates.filter((gate) => !SERIAL.includes(gate))
	const all = (list) => Promise.all(list.map(run))
	if (gates.includes('e2e')) {
		if (gates.includes('ct')) await run('ct')
		await all(['e2e', ...fast])
	} else {
		await all(fast)
		if (gates.includes('ct')) await run('ct')
	}
	return results
}

// Updates both caches after a gate. A failure drops the gate's last pass, which an older tree could otherwise still hold; a Cypress gate keeps the specs that have passed on this tree
export const recordGate = ({
	cache,
	specRecords,
	gate,
	tree,
	status,
	specResults,
}) => {
	if (status === 0) {
		cache.gates[gate] = tree
		delete specRecords[gate]
		return
	}
	delete cache.gates[gate]
	if (specResults)
		specRecords[gate] = {
			tree,
			passed: passedSpecs({
				record: specRecords[gate],
				tree,
				results: specResults,
			}),
		}
}

// The specs a Cypress gate runs, and the passes carried onto this tree. E2E runs only the specs `affected` names, as CI does on a pull request (the whole suite when none is, or with `all`); a push to main runs everything
export const planSpecs = ({
	gate,
	suite,
	record,
	tree,
	changed,
	affected,
	all = false,
}) => {
	if (all) return { suite, specs: null, passed: [] }
	const scoped =
		gate === 'e2e' && affected.length
			? suite.filter((spec) => affected.includes(spec))
			: suite
	const scope = scoped.length ? scoped : suite
	const specs =
		specsToRun({ suite: scope, record, tree, changed }) ??
		(scope === suite ? null : scope)
	return {
		suite: scope,
		specs,
		passed: specs ? scope.filter((spec) => !specs.includes(spec)) : [],
	}
}

const children = new Set()

const stopGates = () => {
	for (const child of children) {
		// Negative PID kills the gate's whole process group (npm, Cypress, Vite)
		try {
			process.kill(-child.pid, 'SIGTERM')
		} catch {
			// Already exited
		}
	}
}

const runGate = (gate, { specs, specResults, env = {} } = {}) =>
	new Promise((resolve) => {
		const { command, withSpecs, summary, failure } = GATES[gate]
		const log = path.join(cacheDir, `${gate}.log`)
		const out = fs.openSync(log, 'w')
		const child = spawn(specs ? withSpecs(specs) : command, {
			cwd: projectDir,
			shell: true,
			detached: true,
			env: {
				...process.env,
				...env,
				...(specResults && { VERIFY_SPEC_RESULTS: specResults }),
			},
			stdio: ['ignore', out, out],
		})
		children.add(child)
		child.on('close', (status) => {
			children.delete(child)
			fs.closeSync(out)
			// Colour codes would stop the summary and failure patterns matching
			const output = stripVTControlCharacters(
				fs.readFileSync(log, 'utf8'),
			)
			fs.writeFileSync(log, output)
			const lines = output.split('\n')
			resolve({
				status: status ?? 1,
				summary:
					lines
						.map((line) => line.match(summary)?.[1])
						.findLast(Boolean) ?? '',
				errors: lines
					.filter((line) => failure.test(line))
					.slice(0, MAX_FAILURE_LINES)
					.map((line) => line.trim()),
				log,
			})
		})
	})

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

	const specRecords = readJson(specsFile)
	const toRun = runArgs.filter((gate) => all || !gateHolds(gate, holds))
	const rows = runArgs
		.filter((gate) => !toRun.includes(gate))
		.map((gate) => [gate, '✅ cached', 'no change since it last passed'])

	// run-e2e.mjs runs these first and stops on their first failure, before the rest of the suite
	const firstSpecs = affectedSpecs(files)

	// A Cypress gate that failed reruns only the specs that have not passed since; `all` runs whole suites
	const plans = Object.fromEntries(
		toRun.filter(isSpecGate).map((gate) => {
			const record = specRecords[gate]
			const since =
				record && record.tree !== tree
					? holds.changedSince(record.tree)
					: []
			const plan = planSpecs({
				gate,
				suite: suiteSpecs(gate, projectDir),
				record,
				tree,
				changed: since?.filter((file) => gatesForFile(file).has(gate)),
				affected: firstSpecs,
				all,
			})
			// recordGate adds this run's passes to these
			specRecords[gate] = { tree, passed: plan.passed }
			return [gate, plan]
		}),
	)
	const rerunNote = (gate) => {
		const { suite, specs } = plans[gate] ?? {}
		if (!specs) return ''
		if (!specs.length) return 'every spec had already passed'
		const ran = `ran ${specs.length} spec${specs.length === 1 ? '' : 's'} (${specs.join(', ')})`
		const passed = suite.length - specs.length
		return passed ? `${ran}; the other ${passed} passed earlier` : ran
	}

	const start = async (gate) => {
		const plan = plans[gate]
		const env =
			gate === 'e2e' && firstSpecs.length
				? { E2E_SPEC_FIRST: firstSpecs.join(',') }
				: {}
		const specResults = plan && path.join(cacheDir, `${gate}-specs.ndjson`)
		if (specResults) fs.rmSync(specResults, { force: true })
		const result =
			plan?.specs?.length === 0
				? { status: 0, summary: '', errors: [], log: '' }
				: await runGate(gate, { specs: plan?.specs, specResults, env })
		recordGate({
			cache,
			specRecords,
			gate,
			tree,
			status: result.status,
			specResults: plan && readSpecResults(specResults),
		})
		fs.writeFileSync(cacheFile, JSON.stringify(cache, null, '\t'))
		fs.writeFileSync(specsFile, JSON.stringify(specRecords, null, '\t'))
		return result
	}

	process.on('SIGINT', () => {
		stopGates()
		writeStatus('fail')
		process.exit(130)
	})

	const results = await scheduleGates(toRun, start, stopGates)

	// ESLint exits 2 when it cannot run at all; never report the other gates on top of a broken config
	if (results.lint?.status === 2) {
		writeStatus('fail')
		console.log(
			'ESLint could not run (exit 2); the other gates were stopped.',
		)
		results.lint.errors.forEach((line) => console.log(`  ${line}`))
		console.log(`  full log: ${results.lint.log}`)
		process.exit(1)
	}

	const failures = []
	for (const gate of toRun) {
		const result = results[gate]
		const note = [result.summary, rerunNote(gate)]
			.filter(Boolean)
			.join('; ')
		if (result.status === 0) rows.push([gate, '✅', note])
		else {
			const kept = plans[gate]
				? `${specRecords[gate].passed.length} of ${plans[gate].suite.length} specs have passed; the next /verify reruns only the rest and any spec edited since`
				: ''
			rows.push([
				gate,
				'❌',
				[note || `exit ${result.status}`, kept]
					.filter(Boolean)
					.join('; '),
			])
			failures.push([gate, result])
		}
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
