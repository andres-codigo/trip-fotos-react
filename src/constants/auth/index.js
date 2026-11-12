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

// Keys the session is mirrored under in localStorage; changing one signs out every existing session
export const SESSION_STORAGE_KEYS = Object.freeze({
	TOKEN: 'token',
	USER_ID: 'userId',
	USER_NAME: 'userName',
	USER_EMAIL: 'userEmail',
	TOKEN_EXPIRATION: 'tokenExpiration',
	IS_ADMIN: 'isAdmin',
})

export const AUTH_FORM_CONFIG = Object.freeze({
	LOGIN_TITLE: 'Log in',
	SIGNUP_TITLE: 'Create an account',
	LOGIN_SUBMIT: 'Log in',
	SIGNUP_SUBMIT: 'Create account',
	LOGIN_BUSY: 'Logging in…',
	SIGNUP_BUSY: 'Creating account…',
	EMAIL_LABEL: 'Email',
	PASSWORD_LABEL: 'Password',
	PASSWORD_HELP: 'At least 6 characters.',
	FORGOT_PASSWORD: 'Forgot password?',
	TO_SIGNUP_PROMPT: 'New here?',
	TO_SIGNUP: 'Create an account',
	TO_LOGIN_PROMPT: 'Already have an account?',
	TO_LOGIN: 'Log in',
})

export const PASSWORD_RESET_CONFIG = Object.freeze({
	TITLE: 'Reset your password',
	INTRO: 'Enter the email you log in with and we will send you a link to choose a new password.',
	SUBMIT: 'Send reset link',
	BUSY: 'Sending link…',
	SENT_TITLE: 'Check your email',
	SENT_MESSAGE: (email) =>
		`If there is an account for ${email}, we have sent it a link to reset the password. The link works for an hour.`,
	SENT_HINT_PREFIX: 'Nothing there? Check your spam folder, or',
	SEND_AGAIN: 'send the link again',
	BACK: 'Back to log in',
})
