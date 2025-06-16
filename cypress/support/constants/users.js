export const user = {
	validEmail: Cypress.env('USER_EMAIL'),
	validPassword: Cypress.env('USER_PASSWORD'),
	invalidEmail: 'invalid-email',
	invalidPassword: 'invalid-password',
	invalidPasswordTooShort: '12345',
}
