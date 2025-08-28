import { describe, it, expect } from 'vitest'

import { getFirebaseAuthErrorMessage } from '../index'
import { FIREBASE_ERROR_TYPES } from '@/constants/firebase-error-types'

const { AUTHENTICATION_ACTION_TYPES: authTypes } = FIREBASE_ERROR_TYPES

describe('getFirebaseAuthErrorMessage', () => {
	it('should return correct message for invalid login credentials', () => {
		const result = getFirebaseAuthErrorMessage(
			authTypes.INVALID_LOGIN_CREDENTIALS,
		)
		expect(result).toBe(authTypes.INVALID_LOGIN_CREDENTIALS_MESSAGE)
	})

	it('should return correct message for too many attempts', () => {
		const result = getFirebaseAuthErrorMessage(
			authTypes.TOO_MANY_ATTEMPTS_TRY_LATER,
		)
		expect(result).toBe(authTypes.TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE)
	})

	it('should return default message for unknown error codes', () => {
		const unknownError = 'unknown-error-code'
		const result = getFirebaseAuthErrorMessage(unknownError)
		expect(result).toBe(authTypes.DEFAULT_MESSAGE)
	})

	it('should return default message for null/undefined errors', () => {
		expect(getFirebaseAuthErrorMessage(null)).toBe(
			authTypes.DEFAULT_MESSAGE,
		)
		expect(getFirebaseAuthErrorMessage(undefined)).toBe(
			authTypes.DEFAULT_MESSAGE,
		)
	})

	it('should return default message for empty string', () => {
		const result = getFirebaseAuthErrorMessage('')
		expect(result).toBe(authTypes.DEFAULT_MESSAGE)
	})
})
