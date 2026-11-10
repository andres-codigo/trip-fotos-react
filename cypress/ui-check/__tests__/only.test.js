import { describe, expect, it } from 'vitest'

import { parseOnly, runsCapture } from '../only'

describe('UI_CHECK_ONLY', () => {
	const title =
		'captures the city filter with many cities, searched, empty and focused'

	it('runs every capture when unset or blank', () => {
		for (const only of [undefined, '', ' , ']) {
			expect(runsCapture(parseOnly(only), title)).toBe(true)
		}
	})

	it('runs a capture whose name contains the filter, in any case', () => {
		expect(runsCapture(parseOnly('City Filter'), title)).toBe(true)
	})

	it('skips a capture whose name does not match', () => {
		expect(runsCapture(parseOnly('messages'), title)).toBe(false)
	})

	it('runs a capture matching any of several comma-separated parts', () => {
		expect(runsCapture(parseOnly('messages, many cities'), title)).toBe(
			true,
		)
	})
})
