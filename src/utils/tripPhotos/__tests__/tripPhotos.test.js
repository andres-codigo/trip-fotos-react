import { describe, expect, it } from 'vitest'

import { isStoredFile, thumbnailUrlsOf, toTripPhotos } from '@/utils/tripPhotos'

describe('toTripPhotos', () => {
	it('pairs each photo with its dimensions and thumbnails by position', () => {
		const thumbnails = [{ width: 320, url: 'a-320' }]

		expect(
			toTripPhotos({
				files: ['a', 'b'],
				fileDimensions: [{ width: 4, height: 3 }],
				fileThumbnails: [thumbnails],
			}),
		).toEqual([
			{ url: 'a', dimensions: { width: 4, height: 3 }, thumbnails },
			{ url: 'b', dimensions: null, thumbnails: null },
		])
	})

	it('reads lists the database stored as index-keyed objects', () => {
		expect(
			toTripPhotos({
				files: { 0: 'a', 1: 'b' },
				fileDimensions: { 1: { width: 1, height: 1 } },
			}),
		).toEqual([
			{ url: 'a', dimensions: null, thumbnails: null },
			{ url: 'b', dimensions: { width: 1, height: 1 }, thumbnails: null },
		])
	})

	it('gives an empty list for a traveller with no photos', () => {
		expect(toTripPhotos({})).toEqual([])
		expect(toTripPhotos()).toEqual([])
	})
})

describe('thumbnailUrlsOf', () => {
	it('lists the URLs of an array or an index-keyed object', () => {
		expect(thumbnailUrlsOf([{ url: 'x' }, { url: 'y' }])).toEqual([
			'x',
			'y',
		])
		expect(thumbnailUrlsOf({ 0: { url: 'x' } })).toEqual(['x'])
		expect(thumbnailUrlsOf(null)).toEqual([])
	})
})

describe('isStoredFile', () => {
	it('counts a Storage URL and refuses an inline data: photo', () => {
		expect(
			isStoredFile(
				'https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg',
			),
		).toBe(true)
		expect(isStoredFile('data:image/svg+xml,%3Csvg/%3E')).toBe(false)
		expect(isStoredFile(null)).toBe(false)
	})
})
