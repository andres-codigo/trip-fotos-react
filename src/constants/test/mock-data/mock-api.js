import { API_DATABASE } from '../../api'
import { MOCK_KEYS } from './mock-user'

export const MOCK_API = Object.freeze({
	URL: 'https://mock-api-url.com/',
	KEY: 'mock-api-key',
	METHOD_POST: 'POST',
})

// Error keys in the body of an Identity Toolkit response, which the Auth SDK turns into an auth/* code
export const IDENTITY_TOOLKIT_ERRORS = Object.freeze({
	EMAIL_EXISTS: 'EMAIL_EXISTS',
	INVALID_LOGIN_CREDENTIALS: 'INVALID_LOGIN_CREDENTIALS',
	TOO_MANY_ATTEMPTS_TRY_LATER: 'TOO_MANY_ATTEMPTS_TRY_LATER',
	UNMAPPED: 'UNMAPPED_ERROR',
})

export const MOCK_API_RESPONSES = {
	GENERIC_ERROR: { error: 'Error' },
	TRAVELLERS_RESPONSE: {
		user1: {
			firstName: 'John',
			lastName: 'Doe',
			description: 'Test description',
			daysInCity: 5,
			cities: ['City1'],
			files: [],
			registered: '2023-01-01',
		},
	},
}

export const MOCK_LOGIN_PAYLOAD = Object.freeze({
	mode: API_DATABASE.AUTH_LOGIN_MODE,
	email: MOCK_KEYS.EMAIL,
	password: MOCK_KEYS.PASSWORD,
})

export const MOCK_SIGNUP_ACTION = Object.freeze({
	type: API_DATABASE.AUTH_SIGNUP_MODE,
	payload: {
		mode: API_DATABASE.AUTH_LOGIN_MODE,
		email: MOCK_KEYS.EMAIL,
		password: MOCK_KEYS.PASSWORD,
	},
})
