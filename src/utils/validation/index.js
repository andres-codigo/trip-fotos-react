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
	const difference = 6 - value.length

	return {
		isValid: value.length >= 6,
		message:
			value.length >= 6
				? ''
				: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT(difference),
	}
}
