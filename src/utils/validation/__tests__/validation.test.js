import { describe, it, expect } from 'vitest'

import { validateEmail, validatePassword } from '@/utils/validation/index'

import { VALIDATION_MESSAGES } from '@/constants/validation'
import {
	VALID_EMAILS,
	INVALID_EMAILS,
	VALID_PASSWORDS,
	SHORT_PASSWORDS,
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

		it('asks for a password when there is none', () => {
			expect(validatePassword('')).toEqual({
				isValid: false,
				message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
			})
		})

		it('gives one too-short message with no countdown', () => {
			SHORT_PASSWORDS.forEach((password) => {
				expect(validatePassword(password)).toEqual({
					isValid: false,
					message: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
				})
			})
		})
	})
})
