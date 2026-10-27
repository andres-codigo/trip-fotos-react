export const ERROR_MESSAGES = Object.freeze({
	// Server/Network errors
	DATA_NOT_FOUND: 'Travellers data not found. Please contact support.',
	REQUEST_ERROR: 'There was a problem with your request. Please try again.',
	NETWORK_CONNECTION_ERROR:
		'Unable to connect to the server. Please check your internet connection.',

	// Generic errors
	UNEXPECTED_ERROR:
		'An unexpected error occurred while loading travellers. Please try again.',
	SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',

	// Authentication errors
	LOGIN_FAILED: "We couldn't sign you in. Please try again.",
	INVALID_LOGIN_CREDENTIALS:
		'The email or password you entered is incorrect.',
	EMAIL_ALREADY_IN_USE:
		'This e-mail address is already in use. Try signing in or use a different e-mail address.',
	TOO_MANY_LOGIN_ATTEMPTS:
		'Too many unsuccessful login attempts. Please try again later.',

	// Traveller-specific errors
	FAILED_TO_REGISTER_TRAVELLER:
		"We couldn't complete your registration. Please try again.",
	FAILED_TO_CONTACT_TRAVELLER:
		"We couldn't send your message. Please try again.",

	// Messages errors
	INVALID_MESSAGE_PAYLOAD: 'Please provide your email address and a message.',
})
