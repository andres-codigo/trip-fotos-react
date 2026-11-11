import { describe, expect, it } from 'vitest'

import { EDIT_TRIP_CONFIG } from '@/constants/travellers'

describe('EDIT_TRIP_CONFIG photo wording', () => {
	it.each([
		[0, 'Removes your trip and your messages for good.'],
		[1, 'Removes your trip, your photo and your messages for good.'],
		[4, 'Removes your trip, all 4 photos and your messages for good.'],
	])('summarises a delete with %i photos', (count, start) => {
		expect(EDIT_TRIP_CONFIG.DELETE_SUMMARY(count)).toMatch(
			new RegExp(`^${start}`),
		)
	})

	it.each([
		[0, 'This permanently removes your trip and your messages.'],
		[
			1,
			'This permanently removes your trip, your photo and your messages.',
		],
		[
			4,
			'This permanently removes your trip, all 4 photos and your messages.',
		],
	])('confirms a delete with %i photos', (count, start) => {
		expect(EDIT_TRIP_CONFIG.DELETE_DIALOG_MESSAGE(count)).toMatch(
			new RegExp(`^${start}`),
		)
	})
})
