export const ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network error occurred',
	API_ERROR: 'API error',
	JAVASCRIPT_ERROR: 'JavaScript error',
	DEFAULT_MESSAGE: 'Default message',
	SOMETHING_WRONG: 'Something went wrong',
	CUSTOM_DEFAULT: 'Custom default',
	FALLBACK_MESSAGE: 'Fallback message',
	DEFAULT_ERROR: 'Default error',
	FALLBACK_ERROR: 'An unknown error occurred.',
}

export const ERROR_OBJECTS = {
	WITH_MESSAGE: { message: ERROR_MESSAGES.NETWORK_ERROR },
	WITH_CODE: { code: 500 },
	EMPTY: {},
	WITH_EMPTY_MESSAGE: { message: '' },
	API_ERROR: { message: ERROR_MESSAGES.API_ERROR },
}

export const JS_ERROR = new Error(ERROR_MESSAGES.JAVASCRIPT_ERROR)
