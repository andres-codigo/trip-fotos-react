import { describe, it, expect } from 'vitest'

import { handleApiError } from '../index'
import {
	API_ERROR_MESSAGE,
	ERROR_OBJECTS,
	JS_ERROR,
} from './errorHandlerTestData'

describe('handleApiError', () => {
	it('should return error message when error has message property', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_MESSAGE,
			API_ERROR_MESSAGE.DEFAULT_MESSAGE,
		)

		expect(result).toBe(API_ERROR_MESSAGE.NETWORK_ERROR)
	})

	it('should return default message when error has no message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_CODE,
			API_ERROR_MESSAGE.SOMETHING_WRONG,
		)

		expect(result).toBe(API_ERROR_MESSAGE.SOMETHING_WRONG)
	})

	it('should return fallback message when error and defaultMessage are undefined', () => {
		const result = handleApiError(undefined, undefined)

		expect(result).toBe(API_ERROR_MESSAGE.FALLBACK_ERROR)
	})

	it('should handle null error gracefully', () => {
		const result = handleApiError(null, API_ERROR_MESSAGE.DEFAULT_MESSAGE)
		expect(result).toBe(API_ERROR_MESSAGE.DEFAULT_MESSAGE)
	})

	it('should handle empty error object', () => {
		const result = handleApiError(
			ERROR_OBJECTS.EMPTY,
			API_ERROR_MESSAGE.CUSTOM_DEFAULT,
		)

		expect(result).toBe(API_ERROR_MESSAGE.CUSTOM_DEFAULT)
	})

	it('should handle error with empty string message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_EMPTY_MESSAGE,
			API_ERROR_MESSAGE.FALLBACK_MESSAGE,
		)

		expect(result).toBe(API_ERROR_MESSAGE.FALLBACK_MESSAGE)
	})

	it('should prioritize error message over default message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.API_ERROR,
			API_ERROR_MESSAGE.DEFAULT_ERROR,
		)

		expect(result).toBe(API_ERROR_MESSAGE.API_ERROR)
	})

	it('should handle Error objects correctly', () => {
		const result = handleApiError(
			JS_ERROR,
			API_ERROR_MESSAGE.DEFAULT_MESSAGE,
		)
		expect(result).toBe(API_ERROR_MESSAGE.JAVASCRIPT_ERROR)
	})

	it('should handle no parameters', () => {
		const result = handleApiError()

		expect(result).toBe(API_ERROR_MESSAGE.FALLBACK_ERROR)
	})
})
