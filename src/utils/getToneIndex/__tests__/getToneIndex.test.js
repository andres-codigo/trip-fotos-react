import { describe, it, expect } from 'vitest'

import { TRAVELLER_AREAS } from '@/constants/travellers'

import { getToneIndex, TONE_COUNT } from '@/utils/getToneIndex'

describe('getToneIndex', () => {
	it('returns the same tone for the same id', () => {
		expect(getToneIndex('osm-1')).toBe(getToneIndex('osm-1'))
	})

	it('gives the legacy cities distinct tones', () => {
		const tones = TRAVELLER_AREAS.map(getToneIndex)
		expect(new Set(tones).size).toBe(TRAVELLER_AREAS.length)
	})

	it.each(['osm-1', 'osm-2', 'a'.repeat(500), ''])(
		'maps %j into the palette',
		(id) => {
			const tone = getToneIndex(id)
			expect(tone).toBeGreaterThanOrEqual(0)
			expect(tone).toBeLessThan(TONE_COUNT)
		},
	)
})
