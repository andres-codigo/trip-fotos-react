import { evaluate, parseArgs, summary } from '../wait-for-ci.mjs'

const SINCE = Date.parse('2026-11-16T10:00:00Z')
const run = (
	name,
	status,
	conclusion,
	createdAt = '2026-11-16T10:00:05Z',
	updatedAt = createdAt,
) => ({
	name,
	status,
	conclusion,
	createdAt,
	updatedAt,
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
		expect(summary(result)).toBe(
			'CI passed: 2 workflows; skipped: Dependabot',
		)
	})

	it('lets a newer run stand for one it cancelled, and waits on a re-run', () => {
		const cancelled = run('Vitest', 'completed', 'cancelled')
		const skipped = run(
			'Vitest',
			'completed',
			'skipped',
			'2026-11-16T10:00:07Z',
			'2026-11-16T10:00:10Z',
		)
		const rerun = { ...cancelled, status: 'in_progress', conclusion: '' }

		expect(summary(evaluate([cancelled, skipped], SINCE))).toBe(
			'CI passed: 1 workflows; skipped: Vitest',
		)
		expect(evaluate([rerun, skipped], SINCE).state).toBe('waiting')
		expect(
			evaluate([{ ...cancelled, conclusion: 'success' }, skipped], SINCE)
				.runs[0].conclusion,
		).toBe('success')
	})

	it('waits on the real run the ready event starts beside a skipped one', () => {
		// PR #781: the skipped run completed first, with a later updatedAt than the real run had while it ran
		const skipped = run(
			'Vitest',
			'completed',
			'skipped',
			'2026-11-16T10:00:36Z',
			'2026-11-16T10:00:47Z',
		)
		const real = run(
			'Vitest',
			'in_progress',
			'',
			'2026-11-16T10:00:39Z',
			'2026-11-16T10:00:40Z',
		)

		expect(evaluate([skipped, real], SINCE).state).toBe('waiting')
		for (const conclusion of ['success', 'failure']) {
			const result = evaluate(
				[
					skipped,
					{
						...real,
						status: 'completed',
						conclusion,
						updatedAt: '2026-11-16T10:02:16Z',
					},
				],
				SINCE,
			)
			expect(result.runs.map((r) => r.conclusion)).toEqual([conclusion])
		}
	})

	it('lets a run that ran outrank a later skipped one', () => {
		const result = evaluate(
			[
				run('Vitest', 'completed', 'failure'),
				run('Vitest', 'completed', 'skipped', '2026-11-16T10:01:00Z'),
			],
			SINCE,
		)

		expect(result.state).toBe('fail')
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
