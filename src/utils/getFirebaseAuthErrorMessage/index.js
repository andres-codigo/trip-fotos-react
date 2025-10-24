import { FIREBASE_ERRORS } from '@/constants/auth'

const { AUTHENTICATION_ACTION_TYPES: authTypes } = FIREBASE_ERRORS

export const getFirebaseAuthErrorMessage = (error) => {
	const messages = {
		[authTypes.INVALID_LOGIN_CREDENTIALS]:
			authTypes.INVALID_LOGIN_CREDENTIALS_MESSAGE,
		[authTypes.TOO_MANY_ATTEMPTS_TRY_LATER]:
			authTypes.TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE,
	}
	return messages[error] || authTypes.DEFAULT_MESSAGE
}
