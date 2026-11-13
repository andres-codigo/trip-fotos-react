import { describe, expect, it } from 'vitest'

import {
	byNewestTrip,
	publicName,
	toPublicTrip,
	toPublicTrips,
} from '@/utils/publicTrip'

const record = {
	firstName: 'Amara',
	lastName: 'okafor',
	tripDescription: 'Eight slow days in Prague.',
	tripStart: '2025-03-12',
	tripEnd: '2025-03-19',
	cities: ['prague', 'tokyo'],
	files: ['photo-1', 'photo-2'],
	fileDimensions: [
		{ width: 4, height: 3 },
		{ width: 3, height: 4 },
	],
	fileThumbnails: [[{ width: 320, url: 'photo-1-320' }], null],
	fileAlts: ['Prague at dusk', 'Tokyo at night'],
	registered: '2025-03-20T10:00:00.000Z',
}

describe('toPublicTrip', () => {
	it('keeps only the public fields and the first photo', () => {
		expect(toPublicTrip(record)).toEqual({
			firstName: 'Amara',
			lastInitial: 'O',
			cities: ['prague', 'tokyo'],
			tripStart: '2025-03-12',
			tripEnd: '2025-03-19',
			daysInCity: null,
			cover: {
				url: 'photo-1',
				dimensions: { width: 4, height: 3 },
				thumbnails: [{ width: 320, url: 'photo-1-320' }],
				alt: 'Prague at dusk',
			},
		})
	})

	it('never copies the trip description, the full last name, other photos or the registration time', () => {
		const json = JSON.stringify(toPublicTrip(record))

		for (const secret of [
			'Eight slow days',
			'okafor',
			'photo-2',
			'Tokyo at night',
			'2025-03-20T10',
		]) {
			expect(json).not.toContain(secret)
		}
	})

	it('reads lists the database stored as objects', () => {
		const { cover } = toPublicTrip({
			...record,
			files: { 0: 'photo-1' },
			fileAlts: { 0: 'Prague at dusk' },
		})

		expect(cover.url).toBe('photo-1')
		expect(cover.alt).toBe('Prague at dusk')
	})

	it('keeps a whole character for the initial', () => {
		expect(toPublicTrip({ lastName: ' Ørsted' }).lastInitial).toBe('Ø')
		expect(toPublicTrip({ lastName: '𝒜da' }).lastInitial).toBe('𝒜')
	})

	it('leaves out what the record does not have', () => {
		expect(toPublicTrip({ firstName: 'Kofi', daysInCity: 8 })).toEqual({
			firstName: 'Kofi',
			lastInitial: null,
			cities: null,
			tripStart: null,
			tripEnd: null,
			daysInCity: 8,
			cover: null,
		})
	})
})

describe('publicName', () => {
	it('shows the first name and last initial', () => {
		expect(publicName({ firstName: 'Amara', lastInitial: 'O' })).toBe(
			'Amara O.',
		)
	})

	it('shows the first name alone with no initial', () => {
		expect(publicName({ firstName: 'Amara', lastInitial: null })).toBe(
			'Amara',
		)
	})
})

describe('byNewestTrip', () => {
	it('puts the latest start first and undated trips last', () => {
		const trips = [
			{ id: 'old', tripStart: '2024-01-01' },
			{ id: 'undated' },
			{ id: 'new', tripStart: '2025-06-01' },
		]

		expect(trips.sort(byNewestTrip).map(({ id }) => id)).toEqual([
			'new',
			'old',
			'undated',
		])
	})
})

describe('toPublicTrips', () => {
	it('keys each summary by its traveller', () => {
		expect(toPublicTrips({ amara: record })).toEqual({
			amara: toPublicTrip(record),
		})
	})

	it('returns no summaries for no travellers', () => {
		expect(toPublicTrips(null)).toEqual({})
	})
})
