import { afterEach, describe, expect, it, vi } from 'vitest'

import { measureImage } from '@/utils/measureImage'

describe('measureImage', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('returns the width and height and releases the bitmap', async () => {
		const close = vi.fn()
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn().mockResolvedValue({ width: 800, height: 600, close }),
		)

		expect(await measureImage(new Blob())).toEqual({
			width: 800,
			height: 600,
		})
		expect(close).toHaveBeenCalled()
	})

	it('returns null when the file cannot be decoded', async () => {
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn().mockRejectedValue(new Error()),
		)

		expect(await measureImage(new Blob())).toBeNull()
	})

	it('returns null when the browser has no createImageBitmap', async () => {
		vi.stubGlobal('createImageBitmap', undefined)

		expect(await measureImage(new Blob())).toBeNull()
	})

	it('returns null for a zero-sized bitmap', async () => {
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn().mockResolvedValue({ width: 0, height: 0 }),
		)

		expect(await measureImage(new Blob())).toBeNull()
	})
})
