import { VALIDATION_MESSAGES } from '@/constants/validation'

export const validateEmail = (value) => {
	const isValid =
		/^[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,6}$/.test(
			value,
		)

	return {
		isValid,
		message: isValid ? '' : VALIDATION_MESSAGES.EMAIL_INVALID,
	}
}

export const validatePassword = (value) => {
	if (!value) {
		return {
			isValid: false,
			message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
		}
	}

	const isValid = value.length >= 6

	return {
		isValid,
		message: isValid ? '' : VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
	}
}
