const getCypressEnv = (key) => {
	if (typeof Cypress !== 'undefined') {
		return Cypress.env(key)
	}
	// Return undefined or a fallback for non-Cypress environments
	return undefined
}

export const TEST_USERS = {
	STANDARD: {
		ID: 'cypress-mock-user-id',
		NAME: 'Cypress Test User',
		EMAIL: getCypressEnv('CYPRESS_USER_EMAIL'),
		PASSWORD: getCypressEnv('CYPRESS_USER_PASSWORD'),
	},
}

export const AUTH_TEST_DATA = {
	INVALID_EMAIL: 'invalid-email',
	INVALID_PASSWORD: 'invalid-password',
	INVALID_PASSWORD_TOO_SHORT: '12345',
}
