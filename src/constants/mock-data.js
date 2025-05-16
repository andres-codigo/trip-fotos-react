export const MOCK_API = Object.freeze({
	URL: 'https://mock-api-url.com/',
	KEY: 'mock-api-key',
	METHOD: 'POST',
})

export const MOCK_USER = Object.freeze({
	TOKEN: 'mock-token',
	USER_ID: 'mock-user-id',
	USER_NAME: 'mock-user-name',
	USER_EMAIL: 'mock-user-email',
	FIRST_NAME: 'John',
	LAST_NAME: 'Doe',
	FULL_NAME: 'John Doe',
})

export const MOCK_STORAGE_KEYS = Object.freeze({
	TOKEN: 'token',
	USER_ID: 'userId',
	USER_NAME: 'userName',
	USER_EMAIL: 'userEmail',
	TOKEN_EXPIRATION: 'tokenExpiration',
})

export const MOCK_KEYS = Object.freeze({
	EMAIL: 'test@example.com',
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
})
