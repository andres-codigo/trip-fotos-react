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
	MODE_PARAM: 'mode',
	TRIP_NOTICE: (firstName) =>
		`Log in or create an account to see ${firstName ? `${firstName}'s` : 'this'} trip.`,
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

// Firebase refuses a burst of verification emails, so the resend link rests between sends
export const RESEND_COOLDOWN_SECONDS = 60

export const VERIFY_EMAIL_CONFIG = Object.freeze({
	TITLE: 'Check your inbox',
	SENT_PREFIX: 'We have sent a link to',
	SENT_SUFFIX:
		'. Open it to verify your email and finish creating your account.',
	RESENT_PREFIX: 'We have sent another link to',
	RESENT_SUFFIX: '. Use the newest email: older links stop working.',
	NOT_YET: (email) =>
		`Your email is not verified yet. Open the link we sent to ${email}, then try again.`,
	HINT_PREFIX: 'Nothing there? Check your spam folder, or',
	SEND_AGAIN: 'send it again',
	COOLDOWN: (seconds) =>
		`Nothing there? Check your spam folder. You can send it again in ${seconds} seconds.`,
	CHECK: "I've verified my email",
	CHECKING: 'Checking…',
	WRONG_ADDRESS_PROMPT: 'Wrong address?',
	START_AGAIN: 'Start again',
})

// The reasons an email link can fail, so the action page picks the right card without a raw Firebase code
export const ACTION_CODE_ERRORS = Object.freeze({
	EXPIRED: 'expired',
	INVALID: 'invalid',
	NETWORK: 'network',
	WEAK_PASSWORD: 'weak-password',
})

export const ACTION_CODE_ERROR_CODES = Object.freeze({
	'auth/expired-action-code': ACTION_CODE_ERRORS.EXPIRED,
	'auth/invalid-action-code': ACTION_CODE_ERRORS.EXPIRED,
	'auth/user-disabled': ACTION_CODE_ERRORS.INVALID,
	'auth/user-not-found': ACTION_CODE_ERRORS.INVALID,
	'auth/argument-error': ACTION_CODE_ERRORS.INVALID,
	'auth/network-request-failed': ACTION_CODE_ERRORS.NETWORK,
	'auth/weak-password': ACTION_CODE_ERRORS.WEAK_PASSWORD,
})

export const AUTH_ACTION_MODES = Object.freeze({
	VERIFY_EMAIL: 'verifyEmail',
	RESET_PASSWORD: 'resetPassword',
})

export const AUTH_ACTION_CONFIG = Object.freeze({
	LOADING: 'Checking your link…',
	VERIFIED_TITLE: 'Your email is verified',
	VERIFIED_TEXT: (firstName) =>
		`Thanks${firstName ? `, ${firstName}` : ''}. You can now register a trip, add photos and message travellers.`,
	VERIFIED_TRAVELLER_TEXT: (firstName) =>
		`Thanks${firstName ? `, ${firstName}` : ''}. You can now add photos and message travellers.`,
	VERIFIED_SIGNED_OUT_TEXT:
		'Log in to register a trip and message travellers.',
	ALREADY_TITLE: 'Your email is already verified',
	ALREADY_TEXT: 'There is nothing more to do.',
	EXPIRED_TITLE: 'This link has expired',
	EXPIRED_TEXT:
		'Each link works once and only for a while. Send a new one and open the newest email.',
	EXPIRED_SIGNED_OUT_TEXT:
		'Each link works once and only for a while. Log in and we will offer to send a new one.',
	EXPIRED_SENT_PREFIX: 'We have sent a new link to',
	RESET_TITLE: 'Choose a new password',
	RESET_FOR: (email) => `For ${email}.`,
	NEW_PASSWORD_LABEL: 'New password',
	RESET_DONE_TITLE: 'Your password has been changed',
	RESET_DONE_TEXT: 'Log in with your new password.',
	RESET_EXPIRED_TITLE: 'This reset link has expired',
	RESET_EXPIRED_TEXT:
		'Each link works once and for an hour. Ask for a new one.',
	INVALID_TITLE: 'This link is not valid',
	INVALID_TEXT:
		'It may be cut short. Open the email again and use the whole link.',
	NETWORK_TITLE: 'Checking your link',
	NETWORK_TEXT:
		'We could not check your link. Check your connection and try again.',
	REGISTER: 'Register your trip',
	GO_TO_TRAVELLERS: 'Go to Travellers',
	LOG_IN: 'Log in',
	SEND_NEW_LINK: 'Send a new link',
	SENDING: 'Sending…',
	TRY_AGAIN: 'Try again',
	SAVE_PASSWORD: 'Save password',
	SAVING: 'Saving…',
	RESET_PASSWORD: 'Reset your password',
})
