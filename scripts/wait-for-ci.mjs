import { execFileSync } from 'node:child_process'

// Waits for the CI runs on a branch so /finish-pr makes one background call
// instead of polling turn by turn. Usage: node scripts/wait-for-ci.mjs <branch> [--since <ISO time>]
// Exit 0: every run passed; 1: a run failed; 2: no run started or the wait timed out.

const PASSED = new Set(['success', 'skipped', 'neutral'])
const INTERVAL_MS = 30_000
const NO_RUNS_MS = 3 * 60_000
const TIMEOUT_MS = 45 * 60_000
// Runs the ready event starts take a few seconds to be listed
const SETTLE_MS = 60_000

// Runs created before `since` (draft-time "skipping" runs) are ignored. Any
// incomplete run keeps the wait going. Then one run stands for each workflow:
// a cancelled run a newer one replaced drops out, a non-skipped run outranks a
// skipped one (the ready event can start both), and the newest created wins
const created = (run) => Date.parse(run.createdAt)

const standing = (runs) => {
	const live = runs.filter(
		(run) =>
			run.conclusion !== 'cancelled' ||
			!runs.some((other) => created(other) > created(run)),
	)
	const ran = live.filter((run) => run.conclusion !== 'skipped')
	return (ran.length ? ran : live).reduce((a, b) =>
		created(b) > created(a) ? b : a,
	)
}

export const evaluate = (runs, since) => {
	const byWorkflow = new Map()
	for (const run of runs) {
		if (created(run) < since) continue
		byWorkflow.set(run.name, [...(byWorkflow.get(run.name) ?? []), run])
	}
	if (byWorkflow.size === 0) return { state: 'none', runs: [] }
	const open = [...byWorkflow.values()]
		.flat()
		.filter((run) => run.status !== 'completed')
	if (open.length) return { state: 'waiting', runs: open }
	const recent = [...byWorkflow.values()].map(standing)
	const failed = recent.filter((run) => !PASSED.has(run.conclusion))
	return { state: failed.length ? 'fail' : 'pass', runs: recent, failed }
}

// Skipped runs are named: a test workflow that skips although the change
// touches its paths is not a pass (docs/ci-cd.md § Finishing an issue)
export const summary = ({ state, runs, failed = [] }) => {
	const skipped = runs.filter((run) => run.conclusion === 'skipped')
	if (state === 'pass')
		return `CI passed: ${runs.length} workflows${skipped.length ? `; skipped: ${skipped.map((run) => run.name).join('; ')}` : ''}`
	if (state === 'fail')
		return `CI failed: ${failed.map((run) => `${run.name} (${run.conclusion}, run ${run.databaseId})`).join('; ')}`
	if (state === 'none') return 'CI: no run started'
	const open = runs.filter((run) => run.status !== 'completed')
	return `CI timed out waiting for: ${open.map((run) => run.name).join('; ')}`
}

export const parseArgs = (argv, now = Date.now()) => {
	const branch = argv.find((arg) => !arg.startsWith('--'))
	const at = argv.indexOf('--since')
	// Default: a minute back, as the script runs straight after `gh pr ready`
	const since = at === -1 ? now - 60_000 : Date.parse(argv[at + 1])
	return { branch, since }
}

const listRuns = (branch) =>
	JSON.parse(
		execFileSync(
			'gh',
			[
				'run',
				'list',
				'--branch',
				branch,
				'--limit',
				'50',
				'--json',
				'name,status,conclusion,createdAt,updatedAt,databaseId',
			],
			{ encoding: 'utf8' },
		),
	)

const main = async () => {
	const { branch, since } = parseArgs(process.argv.slice(2))
	if (!branch || Number.isNaN(since)) {
		console.error(
			'Usage: node scripts/wait-for-ci.mjs <branch> [--since <ISO time>]',
		)
		process.exit(2)
	}
	const start = Date.now()
	for (;;) {
		const result = evaluate(listRuns(branch), since)
		const waited = Date.now() - start
		const done =
			((result.state === 'pass' || result.state === 'fail') &&
				waited >= SETTLE_MS) ||
			(result.state === 'none' && waited >= NO_RUNS_MS) ||
			waited >= TIMEOUT_MS
		if (done) {
			console.log(summary(result))
			process.exit({ pass: 0, fail: 1 }[result.state] ?? 2)
		}
		await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS))
	}
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
