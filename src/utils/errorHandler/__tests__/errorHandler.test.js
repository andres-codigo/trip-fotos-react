import { describe, it, expect } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { handleApiError } from '@/utils/errorHandler/index'

describe('handleApiError', () => {
	it.each([
		['an Error', new Error('Network error'), 'Default', 'Network error'],
		['a string payload', 'API error', 'Default', 'API error'],
		['an empty message', { message: '' }, 'Default', 'Default'],
		['no message', { code: 500 }, 'Default', 'Default'],
		[
			'no error or default',
			undefined,
			undefined,
			ERROR_MESSAGES.SOMETHING_WENT_WRONG,
		],
	])('returns the right message for %s', (_, error, fallback, expected) => {
		expect(handleApiError(error, fallback)).toBe(expected)
	})
})
