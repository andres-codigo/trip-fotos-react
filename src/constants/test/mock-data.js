import { API_DATABASE } from '../api'

export const MOCK_USER = Object.freeze({
	TOKEN: 'mock-token',
	USER_ID: 'mock-user-id',
	USER_NAME: 'mock-user-name',
	USER_EMAIL: 'mock-user-email',
	FIRST_NAME: 'John',
	LAST_NAME: 'Doe',
	FULL_NAME: 'John Doe',
})

export const MOCK_API = Object.freeze({
	URL: 'https://mock-api-url.com/',
	KEY: 'mock-api-key',
	METHOD_POST: 'POST',
})

export const MOCK_API_RESPONSES = {
	DISPLAY_NAME_SUCCESS: { displayName: MOCK_USER.FULL_NAME },
	GENERIC_ERROR: { error: 'Error' },
	TRAVELLERS_RESPONSE: {
		user1: {
			firstName: 'John',
			lastName: 'Doe',
			description: 'Test description',
			daysInCity: 5,
			areas: ['Area1'],
			files: [],
			registered: '2023-01-01',
		},
	},
}

export const MOCK_STATUS = {
	IDLE: 'idle',
	LOADING: 'loading',
	SUCCEEDED: 'succeeded',
	FAILED: 'failed',
}

export const MOCK_STATE_VALUES = {
	EMPTY_STRING: '',
	NULL: null,
	TRUE: true,
	FALSE: false,
	EMPTY_ARRAY: [],
}

export const MOCK_STORAGE_KEYS = Object.freeze({
	TOKEN: 'token',
	USER_ID: 'userId',
	USER_NAME: 'userName',
	USER_EMAIL: 'userEmail',
	TOKEN_EXPIRATION: 'tokenExpiration',
})

export const MOCK_KEYS = Object.freeze({
	EMAIL: 'test@example.com',
	EMAIL_INVALID: 'test@example',
	PASSWORD: 'password123',
	ID_TOKEN: 'mock-id-token',
	LOCAL_ID: 'mock-local-id',
	EXPIRATION: new Date().getTime() + 3600 * 1000,
	EXPIRES_IN: '3600',
})

export const MOCK_MESSAGES = Object.freeze({
	ERROR_UPDATING_TRAVELLER: 'An error occurred while updating traveller ',
	FAILED_TO_UPDATE_TRAVELLER: 'Failed to update traveller ',
	INVALID_PASSWORD: 'INVALID_PASSWORD',
	NETWORK_ERROR: 'Network Error',
	AUTHENTICATING_TITLE: 'Authenticating',
	AUTHENTICATING_DETAILS: 'Authenticating your details, one moment please...',
	TEST_ERROR: 'Test error message',
	LOAD_FAILED: 'Load failed',
	SOMETHING_WENT_WRONG: 'Something went wrong!',
	CLOSEABLE_ERROR: 'Closeable error',
})

export const MOCK_LOGIN_PAYLOAD = Object.freeze({
	mode: API_DATABASE.API_AUTH_LOGIN_MODE,
	email: MOCK_KEYS.EMAIL,
	password: MOCK_KEYS.PASSWORD,
})

export const MOCK_SIGNUP_ACTION = Object.freeze({
	type: API_DATABASE.API_AUTH_SIGNUP_MODE,
	payload: {
		mode: API_DATABASE.API_AUTH_LOGIN_MODE,
		email: MOCK_KEYS.EMAIL,
		password: MOCK_KEYS.PASSWORD,
	},
})

export const MOCK_INVALID_LOGIN_ERROR = Object.freeze({
	code: 'INVALID_LOGIN',
	message: 'The email or password is incorrect.',
	status: 401,
})

export const MOCK_TEST_VALUES = Object.freeze({
	FALSY_VALUES: [null, undefined, '', false, 0],
	TRUTHY_VALUES: ['text', 1, true, {}, []],
})

export const MOCK_TRAVELLERS = {
	SAMPLE_TRAVELLER: {
		id: 'user1',
		firstName: 'John',
		lastName: 'Doe',
		description: 'Test description',
		daysInCity: 5,
		areas: ['Area1'],
		files: [],
		registered: '2023-01-01',
	},
	SAMPLE_TRAVELLERS: [
		{ id: 1, name: 'Test Traveller' },
		{ id: 2, name: 'Another Traveller' },
	],
	TEST_TRAVELLER: {
		id: '1',
		name: 'Test Traveller',
	},
	TEMP_TRAVELLER: { id: 'temp' },
	TEST_NAME: 'Test Name',
}

export const MOCK_TIME = {
	SEVENTY_SECONDS_AGO: 70000,
	THIRTY_SECONDS_AGO: 30000,
}
