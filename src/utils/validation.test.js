import { describe, it, expect } from 'vitest'
import { validateEmail } from './validation'
import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

describe('validation utils', () => {
	describe('validateEmail', () => {
		it('should validate correct email formats', () => {
			const validEmails = [
				'test@example.com',
				'user.name@domain.co.uk',
				'user_name@example.org',
				'user-name@example.net',
			]

			validEmails.forEach((email) => {
				const result = validateEmail(email)
				expect(result.isValid).toBe(true)
				expect(result.message).toBe('')
			})
		})

		it('should reject invalid email formats', () => {
			const invalidEmails = [
				'invalid-email',
				'@example.com',
				'user@',
				'user@.com',
				'user..name@example.com',
			]

			invalidEmails.forEach((email) => {
				const result = validateEmail(email)
				expect(result.isValid).toBe(false)
				expect(result.message).toBe(VALIDATION_MESSAGES.EMAIL_INVALID)
			})
		})
	})
})
