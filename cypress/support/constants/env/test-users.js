export const TEST_USER = {
	MOCK_USER_ID: 'cypress-mock-user-id',
	MOCK_NAME: 'Cypress Test User',
	VALID_EMAIL: Cypress.env('CYPRESS_USER_EMAIL'),
	VALID_PASSWORD: Cypress.env('CYPRESS_USER_PASSWORD'),
	INVALID_EMAIL: 'invalid-email',
	INVALID_PASSWORD: 'invalid-password',
	INVALID_PASSWORD_TOO_SHORT: '12345',
}
