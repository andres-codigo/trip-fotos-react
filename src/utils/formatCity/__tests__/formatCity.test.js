import { describe, it, expect } from 'vitest'

import { formatCity, getCityId } from '@/utils/formatCity'

const SYDNEY = {
	id: 'R5750005',
	city: 'Sydney',
	region: 'New South Wales',
	country: 'Australia',
}

describe('formatCity', () => {
	it('formats a city object as "City, Country"', () => {
		expect(formatCity(SYDNEY)).toBe('Sydney, Australia')
	})

	it('includes the region when asked', () => {
		expect(formatCity(SYDNEY, { withRegion: true })).toBe(
			'Sydney, New South Wales, Australia',
		)
	})

	it('skips a missing region', () => {
		expect(
			formatCity({ ...SYDNEY, region: '' }, { withRegion: true }),
		).toBe('Sydney, Australia')
	})

	it('maps legacy ids to their labels', () => {
		expect(formatCity('prague')).toBe('Prague, Czechia')
	})

	it('returns unknown legacy strings unchanged and empty for nothing', () => {
		expect(formatCity('atlantis')).toBe('atlantis')
		expect(formatCity(null)).toBe('')
	})
})

describe('getCityId', () => {
	it('returns the id of objects and legacy strings', () => {
		expect(getCityId(SYDNEY)).toBe('R5750005')
		expect(getCityId('tokyo')).toBe('tokyo')
		expect(getCityId(undefined)).toBeUndefined()
	})
})
