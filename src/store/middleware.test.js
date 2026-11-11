import { describe, it, expect, vi } from 'vitest'

import {
	MIDDLEWARE_OPTIONS,
	MIDDLEWARE_WARN_AFTER_MS,
	middleware,
} from '@/store/middleware'

describe('store middleware', () => {
	it('raises both development checks past the 32ms default', () => {
		expect(MIDDLEWARE_WARN_AFTER_MS).toBe(128)
		expect(MIDDLEWARE_OPTIONS.immutableCheck.warnAfter).toBe(128)
		expect(MIDDLEWARE_OPTIONS.serializableCheck.warnAfter).toBe(128)
	})

	it('builds the default middleware with those options', () => {
		const getDefaultMiddleware = vi.fn(() => ['default'])

		expect(middleware(getDefaultMiddleware)).toEqual(['default'])
		expect(getDefaultMiddleware).toHaveBeenCalledWith(MIDDLEWARE_OPTIONS)
	})
})
