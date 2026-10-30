const getCypressExposed = (key) => {
	if (typeof Cypress !== 'undefined') {
		return Cypress.expose(key)
	}
	// Return undefined or a fallback for non-Cypress environments
	return undefined
}

export const TEST_USERS = {
	STANDARD: {
		ID:
			getCypressExposed('EMULATOR_STANDARD_UID') ??
			'cypress-mock-user-id',
		NAME: 'Cypress Test User',
		EMAIL: getCypressExposed('CYPRESS_USER_EMAIL'),
		PASSWORD: getCypressExposed('CYPRESS_USER_PASSWORD'),
	},
	// Seeded traveller with an inbox; the live smoke test does not use it
	TRAVELLER: {
		ID: getCypressExposed('EMULATOR_TRAVELLER_UID'),
		EMAIL: getCypressExposed('EMULATOR_TRAVELLER_EMAIL'),
		PASSWORD: getCypressExposed('CYPRESS_USER_PASSWORD'),
	},
	// Seeded traveller with no inbox, for contacting from the other accounts
	OTHER_TRAVELLER: {
		ID: getCypressExposed('EMULATOR_OTHER_TRAVELLER_UID'),
	},
	// Seeded account with the admin custom claim
	ADMIN: {
		EMAIL: getCypressExposed('EMULATOR_ADMIN_EMAIL'),
		PASSWORD: getCypressExposed('CYPRESS_USER_PASSWORD'),
	},
}

export const AUTH_TEST_DATA = {
	INVALID_EMAIL: 'invalid-email',
	INVALID_PASSWORD: 'invalid-password',
	INVALID_PASSWORD_TOO_SHORT: '12345',
}
