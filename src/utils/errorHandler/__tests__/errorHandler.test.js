import { describe, it, expect } from 'vitest'
import { handleApiError } from '../index'

describe('handleApiError', () => {
	it('should return error message when error has message property', () => {
		const error = { message: 'Network error occurred' }
		const result = handleApiError(error, 'Default message')

		expect(result).toBe('Network error occurred')
	})

	it('should return default message when error has no message', () => {
		const error = { code: 500 }
		const defaultMessage = 'Something went wrong'
		const result = handleApiError(error, defaultMessage)

		expect(result).toBe('Something went wrong')
	})

	it('should return fallback message when error and defaultMessage are undefined', () => {
		const result = handleApiError(undefined, undefined)

		expect(result).toBe('An unknown error occurred.')
	})

	it('should handle null error gracefully', () => {
		const result = handleApiError(null, 'Default message')

		expect(result).toBe('Default message')
	})

	it('should handle empty error object', () => {
		const error = {}
		const defaultMessage = 'Custom default'
		const result = handleApiError(error, defaultMessage)

		expect(result).toBe('Custom default')
	})

	it('should handle error with empty string message', () => {
		const error = { message: '' }
		const defaultMessage = 'Fallback message'
		const result = handleApiError(error, defaultMessage)

		expect(result).toBe('Fallback message')
	})

	it('should prioritize error message over default message', () => {
		const error = { message: 'API error' }
		const defaultMessage = 'Default error'
		const result = handleApiError(error, defaultMessage)

		expect(result).toBe('API error')
	})

	it('should handle Error objects correctly', () => {
		const error = new Error('JavaScript error')
		const result = handleApiError(error, 'Default message')

		expect(result).toBe('JavaScript error')
	})

	it('should handle no parameters', () => {
		const result = handleApiError()

		expect(result).toBe('An unknown error occurred.')
	})
})
