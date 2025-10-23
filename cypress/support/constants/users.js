export const user = {
	mockUserId: 'cypress-mock-user-id',
	mockName: 'Cypress Test User',
	validEmail: Cypress.env('CYPRESS_USER_EMAIL'),
	validPassword: Cypress.env('CYPRESS_USER_PASSWORD'),
	invalidEmail: 'invalid-email',
	invalidPassword: 'invalid-password',
	invalidPasswordTooShort: '12345',
}
