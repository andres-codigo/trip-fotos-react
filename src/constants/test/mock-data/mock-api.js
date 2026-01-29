import { API_DATABASE } from '../../api'
import { MOCK_USER, MOCK_KEYS } from './mock-user'

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

export const MOCK_INVALID_LOGIN_ERROR = Object.freeze({
	code: 'INVALID_LOGIN',
	message: 'The email or password is incorrect.',
	status: 401,
})
