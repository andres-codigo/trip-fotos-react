import { describe, expect, it } from 'vitest'

import { parseWidths, reuseVerdict, shouldStamp } from '../main-captures.mjs'

const COMMIT = 'a'.repeat(40)
const stamp = {
	commit: COMMIT,
	script: 'script-hash',
	widths: [390, 768, 1280],
}

describe('reusing the main captures', () => {
	it('reuses them when the commit, the script and the widths all match', () => {
		expect(
			reuseVerdict(stamp, { ...stamp, widths: [390, 1280] }),
		).toMatchObject({ reuse: true })
	})

	it.each([
		['nothing was recorded', null, {}, /no full main capture/],
		[
			'main has moved',
			stamp,
			{ commit: 'b'.repeat(40) },
			/main moved from aaaaaaa to bbbbbbb/,
		],
		['the script changed', stamp, { script: 'other' }, /capture script/],
		[
			'a width was not captured',
			{ ...stamp, widths: [390, 1280] },
			{ widths: [390, 1023, 1024] },
			/1023, 1024px/,
		],
	])('retakes them when %s', (_, recorded, change, reason) => {
		const verdict = reuseVerdict(recorded, { ...stamp, ...change })

		expect(verdict.reuse).toBe(false)
		expect(verdict.reason).toMatch(reason)
	})

	it('records only a full, passing main run of committed code', () => {
		const run = { label: 'main', only: '', failed: 0, dirty: false }

		expect(shouldStamp(run)).toBe(true)
		expect(shouldStamp({ ...run, label: 'branch' })).toBe(false)
		expect(shouldStamp({ ...run, only: 'messages' })).toBe(false)
		expect(shouldStamp({ ...run, failed: 1 })).toBe(false)
		expect(shouldStamp({ ...run, dirty: true })).toBe(false)
	})

	it('defaults to the two standard widths', () => {
		expect(parseWidths(undefined)).toEqual([390, 1280])
		expect(parseWidths('390,768,1280')).toEqual([390, 768, 1280])
	})
})
