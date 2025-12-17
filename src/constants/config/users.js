const getCypressEnv = (key) => {
	if (typeof Cypress !== 'undefined') {
		return Cypress.env(key)
	}
	// Return undefined or a fallback for non-Cypress environments
	return undefined
}

export const TEST_USER = {
	MOCK_USER_ID: 'cypress-mock-user-id',
	MOCK_NAME: 'Cypress Test User',
	VALID_EMAIL: getCypressEnv('CYPRESS_USER_EMAIL'),
	VALID_PASSWORD: getCypressEnv('CYPRESS_USER_PASSWORD'),
	INVALID_EMAIL: 'invalid-email',
	INVALID_PASSWORD: 'invalid-password',
	INVALID_PASSWORD_TOO_SHORT: '12345',
}
