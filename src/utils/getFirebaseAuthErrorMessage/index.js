import { FIREBASE_ERROR_TYPES } from '@/constants/firebase-error-types'

const { AUTHENTICATION_ACTION_TYPES: authTypes } = FIREBASE_ERROR_TYPES

export const getFirebaseAuthErrorMessage = (error) => {
	const messages = {
		[authTypes.INVALID_LOGIN_CREDENTIALS]:
			authTypes.INVALID_LOGIN_CREDENTIALS_MESSAGE,
		[authTypes.TOO_MANY_ATTEMPTS_TRY_LATER]:
			authTypes.TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE,
	}
	return messages[error] || authTypes.DEFAULT_MESSAGE
}
