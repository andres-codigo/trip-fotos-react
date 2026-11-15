import { execFileSync } from 'node:child_process'

// Waits for the CI runs on a branch so /finish-pr makes one background call
// instead of polling turn by turn. Usage: node scripts/wait-for-ci.mjs <branch> [--since <ISO time>]
// Exit 0: every run passed; 1: a run failed; 2: no run started or the wait timed out.

const PASSED = new Set(['success', 'skipped', 'neutral'])
const INTERVAL_MS = 30_000
const NO_RUNS_MS = 3 * 60_000
const TIMEOUT_MS = 45 * 60_000

// Runs created before `since` (draft-time "skipping" runs) are ignored
export const evaluate = (runs, since) => {
	const recent = runs.filter((run) => Date.parse(run.createdAt) >= since)
	if (recent.length === 0) return { state: 'none', runs: recent }
	if (recent.some((run) => run.status !== 'completed'))
		return { state: 'waiting', runs: recent }
	const failed = recent.filter((run) => !PASSED.has(run.conclusion))
	return { state: failed.length ? 'fail' : 'pass', runs: recent, failed }
}

export const summary = ({ state, runs, failed = [] }) => {
	if (state === 'pass') return `CI passed: ${runs.length} runs`
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
				'name,status,conclusion,createdAt,databaseId',
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
			result.state === 'pass' ||
			result.state === 'fail' ||
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
