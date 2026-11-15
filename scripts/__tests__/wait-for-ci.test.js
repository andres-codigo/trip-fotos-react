import { evaluate, parseArgs, summary } from '../wait-for-ci.mjs'

const SINCE = Date.parse('2026-11-16T10:00:00Z')
const run = (name, status, conclusion, createdAt = '2026-11-16T10:00:05Z') => ({
	name,
	status,
	conclusion,
	createdAt,
	databaseId: 1,
})

describe('wait-for-ci', () => {
	it('ignores runs created before the ready time', () => {
		const result = evaluate(
			[run('Vitest', 'completed', 'skipped', '2026-11-16T09:00:00Z')],
			SINCE,
		)
		expect(result.state).toBe('none')
	})

	it('waits while any recent run is incomplete', () => {
		const result = evaluate(
			[
				run('Vitest', 'completed', 'success'),
				run('E2E', 'in_progress', ''),
			],
			SINCE,
		)
		expect(result.state).toBe('waiting')
		expect(summary(result)).toBe('CI timed out waiting for: E2E')
	})

	it('passes when every recent run succeeded or skipped', () => {
		const result = evaluate(
			[
				run('Vitest', 'completed', 'success'),
				run('Dependabot', 'completed', 'skipped'),
			],
			SINCE,
		)
		expect(summary(result)).toBe('CI passed: 2 runs')
	})

	it('fails and names the failed runs', () => {
		const result = evaluate(
			[
				run('Vitest', 'completed', 'success'),
				run('E2E', 'completed', 'failure'),
			],
			SINCE,
		)
		expect(result.state).toBe('fail')
		expect(summary(result)).toBe('CI failed: E2E (failure, run 1)')
	})

	it('reads the branch and defaults the ready time to a minute back', () => {
		expect(parseArgs(['main'], SINCE)).toEqual({
			branch: 'main',
			since: SINCE - 60_000,
		})
		expect(
			parseArgs(['main', '--since', '2026-11-16T10:00:00Z']).since,
		).toBe(SINCE)
	})
})
