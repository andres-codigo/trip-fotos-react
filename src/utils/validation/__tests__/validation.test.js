import { describe, it, expect } from 'vitest'

import { validateEmail, validatePassword } from '../index'

import { VALIDATION_MESSAGES } from '@/constants/validation'
import {
	VALID_EMAILS,
	INVALID_EMAILS,
	VALID_PASSWORDS,
	PASSWORD_CHARACTER_DIFFERENCE,
} from './validationTestData'

/**
 * Validation Utilities Unit Tests
 *
 * Tests email and password validation functions for user authentication forms.
 *
 * Test Data:
 * - validationTestData: External file containing arrays of valid/invalid test cases
 *   - VALID_EMAILS: Array of correctly formatted email addresses
 *   - INVALID_EMAILS: Array of malformed email addresses
 *   - VALID_PASSWORDS: Array of passwords meeting minimum requirements (6+ characters)
 *   - PASSWORD_CHARACTER_DIFFERENCE: Test cases for password length validation messages
 *
 * Validation Functions:
 * - validateEmail: Checks email format against regex pattern
 * - validatePassword: Ensures password meets minimum length (6 characters)
 *
 * Return Format:
 * Both functions return { isValid: boolean, message: string }
 *
 * Test Coverage:
 * - Email validation: Valid and invalid format handling
 * - Password validation: Length requirements and error messaging
 * - Character difference messages: Dynamic feedback for password length
 */

describe('validation utils', () => {
	describe('validateEmail', () => {
		it('should validate correct email formats', () => {
			VALID_EMAILS.forEach((email) => {
				const result = validateEmail(email)
				expect(result.isValid).toBe(true)
				expect(result.message).toBe('')
			})
		})

		it('should reject invalid email formats', () => {
			INVALID_EMAILS.forEach((email) => {
				const result = validateEmail(email)
				expect(result.isValid).toBe(false)
				expect(result.message).toBe(VALIDATION_MESSAGES.EMAIL_INVALID)
			})
		})
	})

	describe('validatePassword', () => {
		it('should validate passwords with 6 or more characters', () => {
			VALID_PASSWORDS.forEach((password) => {
				const result = validatePassword(password)
				expect(result.isValid).toBe(true)
				expect(result.message).toBe('')
			})
		})

		it('should provide correct character difference message', () => {
			PASSWORD_CHARACTER_DIFFERENCE.forEach(
				({ password, expectedDiff }) => {
					const result = validatePassword(password)
					expect(result.message).toBe(
						VALIDATION_MESSAGES.PASSWORD_TOO_SHORT(expectedDiff),
					)
				},
			)
		})
	})
})
