export const ERROR_MESSAGES = Object.freeze({
	// Browser error messages
	FAILED_TO_FETCH: 'Failed to fetch',

	// Server/Network errors
	SERVER_ERROR:
		'The server is currently experiencing issues. Please try again later.',
	DATA_NOT_FOUND: 'Travellers data not found. Please contact support.',
	REQUEST_ERROR: 'There was a problem with your request. Please try again.',
	CONNECTION_ERROR:
		'Unable to load travellers. Please check your connection and try again.',
	NETWORK_CONNECTION_ERROR:
		'Unable to connect to the server. Please check your internet connection.',

	// Generic errors
	UNEXPECTED_ERROR:
		'An unexpected error occurred while loading travellers. Please try again.',
	REFRESH_ERROR: 'Failed to load travellers. Please try refreshing the page.',
	SOMETHING_WENT_WRONG: 'Something went wrong!',
	NETWORK_ERROR: 'Network Error',

	// Authentication errors
	LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
	LOGIN_FAILED_FALLBACK: 'Login failed.',
	INVALID_PASSWORD: 'INVALID_PASSWORD',

	// Traveller-specific errors
	ERROR_UPDATING_TRAVELLER: 'An error occurred while updating traveller ',
	FAILED_TO_UPDATE_TRAVELLER: 'Failed to update traveller ',

	// Default fallback
	UNKNOWN_ERROR: 'An unknown error occurred.',
})
