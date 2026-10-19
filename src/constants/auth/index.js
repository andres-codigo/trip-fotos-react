export const FIREBASE_ERRORS = Object.freeze({
	// FIREBASE ERROR MESSAGES
	AUTHENTICATION_ACTION_TYPES: {
		DEFAULT: 'DEFAULT',
		DEFAULT_MESSAGE: 'An unexpected error occurred. Please try again.',
		EMAIL_EXISTS: 'EMAIL_EXISTS',
		EMAIL_EXISTS_MESSAGE:
			'This e-mail address is already in use. Try signing in or use a different e-mail address.',
		INVALID_LOGIN_CREDENTIALS: 'INVALID_LOGIN_CREDENTIALS',
		INVALID_LOGIN_CREDENTIALS_MESSAGE:
			'The email or password you entered is incorrect.',
		TOO_MANY_ATTEMPTS_TRY_LATER: 'TOO_MANY_ATTEMPTS_TRY_LATER',
		TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE:
			'Too many unsuccessful login attempts. Please try again later.',
	},
	// Firebase Auth SDK codes mapped to the REST error keys the UI already handles
	SDK_ERROR_CODES: Object.freeze({
		'auth/email-already-in-use': 'EMAIL_EXISTS',
		'auth/invalid-credential': 'INVALID_LOGIN_CREDENTIALS',
		'auth/invalid-login-credentials': 'INVALID_LOGIN_CREDENTIALS',
		'auth/user-not-found': 'INVALID_LOGIN_CREDENTIALS',
		'auth/wrong-password': 'INVALID_LOGIN_CREDENTIALS',
		'auth/too-many-requests': 'TOO_MANY_ATTEMPTS_TRY_LATER',
	}),
})
