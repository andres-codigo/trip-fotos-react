import { describe, it, expect } from 'vitest'

import { handleApiError } from '../index'
import { ERROR_MESSAGES, ERROR_OBJECTS, JS_ERROR } from './errorHandlerTestData'

describe('handleApiError', () => {
	it('should return error message when error has message property', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_MESSAGE,
			ERROR_MESSAGES.DEFAULT_MESSAGE,
		)

		expect(result).toBe(ERROR_MESSAGES.NETWORK_ERROR)
	})

	it('should return default message when error has no message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_CODE,
			ERROR_MESSAGES.SOMETHING_WRONG,
		)

		expect(result).toBe(ERROR_MESSAGES.SOMETHING_WRONG)
	})

	it('should return fallback message when error and defaultMessage are undefined', () => {
		const result = handleApiError(undefined, undefined)

		expect(result).toBe(ERROR_MESSAGES.FALLBACK_ERROR)
	})

	it('should handle null error gracefully', () => {
		const result = handleApiError(null, ERROR_MESSAGES.DEFAULT_MESSAGE)

		expect(result).toBe(ERROR_MESSAGES.DEFAULT_MESSAGE)
	})

	it('should handle empty error object', () => {
		const result = handleApiError(
			ERROR_OBJECTS.EMPTY,
			ERROR_MESSAGES.CUSTOM_DEFAULT,
		)

		expect(result).toBe(ERROR_MESSAGES.CUSTOM_DEFAULT)
	})

	it('should handle error with empty string message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.WITH_EMPTY_MESSAGE,
			ERROR_MESSAGES.FALLBACK_MESSAGE,
		)

		expect(result).toBe(ERROR_MESSAGES.FALLBACK_MESSAGE)
	})

	it('should prioritize error message over default message', () => {
		const result = handleApiError(
			ERROR_OBJECTS.API_ERROR,
			ERROR_MESSAGES.DEFAULT_ERROR,
		)

		expect(result).toBe(ERROR_MESSAGES.API_ERROR)
	})

	it('should handle Error objects correctly', () => {
		const result = handleApiError(JS_ERROR, ERROR_MESSAGES.DEFAULT_MESSAGE)

		expect(result).toBe(ERROR_MESSAGES.JAVASCRIPT_ERROR)
	})

	it('should handle no parameters', () => {
		const result = handleApiError()

		expect(result).toBe(ERROR_MESSAGES.FALLBACK_ERROR)
	})
})
