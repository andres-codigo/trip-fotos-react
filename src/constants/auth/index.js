import { ERROR_MESSAGES } from '../errors'

export const FIREBASE_ERRORS = Object.freeze({
	// Firebase Auth SDK codes mapped to the user-facing message shown in the UI
	SDK_ERROR_CODES: Object.freeze({
		'auth/email-already-in-use': ERROR_MESSAGES.EMAIL_ALREADY_IN_USE,
		'auth/invalid-credential': ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
		'auth/invalid-login-credentials':
			ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
		'auth/user-not-found': ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
		'auth/wrong-password': ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
		'auth/too-many-requests': ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS,
		'auth/network-request-failed': ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
	}),
})
