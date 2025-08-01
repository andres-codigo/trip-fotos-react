import { describe, it, expect } from 'vitest'
import { validateEmail } from './validation'

import { VALIDATION_MESSAGES } from '@/constants/validation-messages'
import { VALID_EMAILS, INVALID_EMAILS } from './testConstants'

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
})
