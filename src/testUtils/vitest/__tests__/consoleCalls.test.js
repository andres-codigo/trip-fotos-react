import { describe, it, expect } from 'vitest'

import {
	describeUnexpectedCalls,
	findUnexpectedCalls,
} from '@/testUtils/vitest/consoleCalls'

describe('findUnexpectedCalls', () => {
	it('returns nothing when there were no console calls', () => {
		expect(findUnexpectedCalls({ error: [], warn: [] })).toEqual([])
	})

	it('reports an error and a warning with their formatted messages', () => {
		expect(
			findUnexpectedCalls({
				error: [['Bad prop %s', 'x']],
				warn: [['Careful']],
			}),
		).toEqual([
			{ method: 'error', message: 'Bad prop x' },
			{ method: 'warn', message: 'Careful' },
		])
	})

	it('ignores messages that match an allow-list pattern', () => {
		expect(
			findUnexpectedCalls(
				{ error: [['Known noise from a library'], ['Real problem']] },
				[/Known noise/],
			),
		).toEqual([{ method: 'error', message: 'Real problem' }])
	})
})

describe('describeUnexpectedCalls', () => {
	it('lists each call on its own line with its method', () => {
		expect(
			describeUnexpectedCalls([
				{ method: 'error', message: 'One' },
				{ method: 'warn', message: 'Two' },
			]),
		).toBe(
			'Unexpected console output:\nconsole.error: One\nconsole.warn: Two',
		)
	})
})
