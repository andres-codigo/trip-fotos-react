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
	files: ['photo-1', 'photo-2', 'photo-3', 'photo-4'],
	fileDimensions: [
		{ width: 4, height: 3 },
		{ width: 3, height: 4 },
		{ width: 1, height: 1 },
		{ width: 2, height: 1 },
	],
	fileThumbnails: [
		[{ width: 320, url: 'photo-1-320' }],
		null,
		[{ width: 320, url: 'photo-3-320' }],
		[{ width: 320, url: 'photo-4-320' }],
	],
	fileAlts: ['Prague at dusk', 'Tokyo at night', null, 'Kyoto in snow'],
	registered: '2025-03-20T10:00:00.000Z',
}

describe('toPublicTrip', () => {
	it('keeps only the public fields and the first three photos, in upload order', () => {
		expect(toPublicTrip(record)).toEqual({
			firstName: 'Amara',
			lastInitial: 'O',
			cities: ['prague', 'tokyo'],
			tripStart: '2025-03-12',
			tripEnd: '2025-03-19',
			daysInCity: null,
			photos: [
				{
					url: 'photo-1',
					dimensions: { width: 4, height: 3 },
					thumbnails: [{ width: 320, url: 'photo-1-320' }],
					alt: 'Prague at dusk',
				},
				{
					url: 'photo-2',
					dimensions: { width: 3, height: 4 },
					thumbnails: null,
					alt: 'Tokyo at night',
				},
				{
					url: 'photo-3',
					dimensions: { width: 1, height: 1 },
					thumbnails: [{ width: 320, url: 'photo-3-320' }],
					alt: null,
				},
			],
		})
	})

	it('keeps every photo of a trip with three or fewer', () => {
		const photoUrls = (files) =>
			toPublicTrip({ ...record, files }).photos.map(({ url }) => url)

		expect(photoUrls(['photo-1'])).toEqual(['photo-1'])
		expect(photoUrls(['photo-1', 'photo-2', 'photo-3'])).toEqual([
			'photo-1',
			'photo-2',
			'photo-3',
		])
	})

	it.each([
		['no list', undefined],
		['an empty list', []],
	])('keeps no photos for %s', (_, files) => {
		expect(toPublicTrip({ ...record, files }).photos).toBeNull()
	})

	it('never copies the trip description, the full last name, a fourth photo or the registration time', () => {
		const json = JSON.stringify(toPublicTrip(record))

		for (const secret of [
			'Eight slow days',
			'okafor',
			'photo-4',
			'Kyoto in snow',
			'2025-03-20T10',
		]) {
			expect(json).not.toContain(secret)
		}
	})

	// The database drops null entries, so photo 2's missing alt leaves key 1 out
	it('matches each photo to its own fields in lists the database stored as objects', () => {
		const { photos } = toPublicTrip({
			...record,
			files: { 0: 'photo-1', 1: 'photo-2', 2: 'photo-3' },
			fileThumbnails: { 2: [{ width: 320, url: 'photo-3-320' }] },
			fileAlts: { 0: 'Prague at dusk', 2: 'Kyoto in snow' },
		})

		expect(photos.map(({ alt }) => alt)).toEqual([
			'Prague at dusk',
			null,
			'Kyoto in snow',
		])
		expect(photos.map(({ thumbnails }) => thumbnails)).toEqual([
			null,
			null,
			[{ width: 320, url: 'photo-3-320' }],
		])
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
			photos: null,
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
