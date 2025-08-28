import { describe, it, expect } from 'vitest'

import { validateEmail, validatePassword } from '../index'

import { VALIDATION_MESSAGES } from '@/constants/validation-messages'
import {
	VALID_EMAILS,
	INVALID_EMAILS,
	VALID_PASSWORDS,
	PASSWORD_CHARACTER_DIFFERENCE,
} from './validationTestData'

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
