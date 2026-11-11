import { describe, expect, it } from 'vitest'

import {
	DEFAULT_WIDTHS,
	onlyHashDiffers,
	parseOnly,
	parseWidthSpec,
	runsCapture,
	widthsFor,
} from '../selection'

describe('UI_CHECK_ONLY', () => {
	const id = 'city-filter-many'
	const title =
		'captures the city filter with many cities, searched, empty and focused'

	it('runs every capture when unset or blank', () => {
		for (const only of [undefined, '', ' , ']) {
			expect(runsCapture(parseOnly(only), id, title)).toBe(true)
		}
	})

	it('runs a capture whose id or title contains the filter, in any case', () => {
		expect(runsCapture(parseOnly('City Filter'), id, title)).toBe(true)
		expect(runsCapture(parseOnly('filter-many'), id, title)).toBe(true)
	})

	it('skips a capture whose id and title do not match', () => {
		expect(runsCapture(parseOnly('messages'), id, title)).toBe(false)
	})

	it('runs a capture matching any of several comma-separated parts', () => {
		expect(runsCapture(parseOnly('messages, many cities'), id, title)).toBe(
			true,
		)
	})
})

describe('UI_CHECK_WIDTHS', () => {
	it('defaults to the two standard widths', () => {
		expect(parseWidthSpec(undefined).base).toEqual(DEFAULT_WIDTHS)
		expect(parseWidthSpec('').base).toEqual([390, 1280])
	})

	it('gives every capture the same widths when no capture is named', () => {
		const spec = parseWidthSpec('390,768,1280')

		expect(widthsFor(spec, 'messages-states')).toEqual([390, 768, 1280])
	})

	it('gives a named capture its own widths and the rest the base ones', () => {
		const spec = parseWidthSpec('390,1280;edit=390,768,1280;public=390')

		expect(widthsFor(spec, 'edit-states')).toEqual([390, 768, 1280])
		expect(widthsFor(spec, 'own-trip', 'the EDIT page')).toEqual([
			390, 768, 1280,
		])
		expect(widthsFor(spec, 'public-pages')).toEqual([390])
		expect(widthsFor(spec, 'messages-states')).toEqual([390, 1280])
	})

	it('ignores a malformed override', () => {
		expect(parseWidthSpec('390;=768;edit').overrides).toEqual([])
	})
})

describe('onlyHashDiffers', () => {
	const page = 'http://localhost:5190/travellers/one/edit'

	it('is true when only the hash changes, which cy.visit would not reload', () => {
		expect(onlyHashDiffers(page, `${page}#photos`)).toBe(true)
		expect(onlyHashDiffers(`${page}#a`, '/travellers/one/edit')).toBe(true)
	})

	it('is false for another path or query, or before the first visit', () => {
		expect(onlyHashDiffers(page, '/travellers')).toBe(false)
		expect(onlyHashDiffers(page, `${page}?ref=1`)).toBe(false)
		expect(onlyHashDiffers('about:blank', '/travellers')).toBe(false)
	})
})
