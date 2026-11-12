import { describe, expect, it } from 'vitest'

import { thumbnailUrlsOf, toTripPhotos } from '@/utils/tripPhotos'

describe('toTripPhotos', () => {
	it('pairs each photo with its dimensions and thumbnails by position', () => {
		const thumbnails = [{ width: 320, url: 'a-320' }]

		expect(
			toTripPhotos({
				files: ['a', 'b'],
				fileDimensions: [{ width: 4, height: 3 }],
				fileThumbnails: [thumbnails],
				fileAlts: [null, 'Prague at dusk'],
			}),
		).toEqual([
			{
				url: 'a',
				dimensions: { width: 4, height: 3 },
				thumbnails,
				alt: '',
			},
			{
				url: 'b',
				dimensions: null,
				thumbnails: null,
				alt: 'Prague at dusk',
			},
		])
	})

	it('reads lists the database stored as index-keyed objects', () => {
		expect(
			toTripPhotos({
				files: { 0: 'a', 1: 'b' },
				fileDimensions: { 1: { width: 1, height: 1 } },
			}),
		).toEqual([
			{ url: 'a', dimensions: null, thumbnails: null, alt: '' },
			{
				url: 'b',
				dimensions: { width: 1, height: 1 },
				thumbnails: null,
				alt: '',
			},
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
