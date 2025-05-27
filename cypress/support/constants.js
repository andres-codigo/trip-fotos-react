export const api = {
	// API
	apiUrl: Cypress.env('VITE_API_URL'),
	apiKey: Cypress.env('VITE_API_KEY'),
}

export const baseUrl = Cypress.config('baseUrl')

export const urls = {
	cyAuth: Cypress.env('AUTHENTICATION_URL'),
	cyTrips: Cypress.env('TRIPS_URL'),
	cyMessages: Cypress.env('MESSAGES_URL'),
	cyPageNotFound: Cypress.env('PAGENOTFOUND_URL'),
	cyNonExistentPath: Cypress.env('NON_EXISTENT_URL'),
}

export const viewports = {
	desktop: {
		width: 1280,
		height: 800,
	},
	tablet: {
		width: 1024,
		height: 768,
	},
	mobile: {
		width: 375,
		height: 667,
	},
}

export const user = {
	validEmail: Cypress.env('USER_EMAIL'),
	validPassword: Cypress.env('USER_PASSWORD'),
	invalidEmail: 'invalid-email',
	invalidPassword: 'invalid-password',
	invalidPasswordTooShort: '12345',
}

export const domAttributeUrls = {
	root: Cypress.env('ROOT_URL'),
}

export const topNavigationSelectors = {
	siteHeader: '[data-cy="site-header"]',
	siteHeaderTitleLink: '[data-cy="site-header-title-link"]',
	navMenuItemMessages: '[data-cy="nav-menu-item-messages"]',
	totalMessages: '[data-cy="total-messages"]',
	navMenuItemTravellers: '[data-cy="nav-menu-item-travellers"]',
	navMenuItemLogin: '[data-cy="nav-menu-item-login"]',
	navMenuItemLogout: '[data-cy="nav-menu-item-logout"]',
	navHamburgerMenu: '[data-cy="hamburger-menu"]',
}

export const authenticationFormSelectors = {
	// Email fields
	emailLabel: 'E-Mail',
	emailInput: '[data-cy="email-input"]',
	emailErrorMessage: '[data-cy="email-error-message"]',
	// Password fields
	passwordLabel: 'Password',
	passwordInput: '[data-cy="password-input"]',
	passwordErrorMessage: '[data-cy="password-error-message"]',
	// Submit buttons
	submitButtonTextLogin: 'Login',
	submitButtonLogin: '[data-cy="submit-button-login"]',
	submitButtonTextSignup: 'Sign-up',
	submitButtonSignup: '[data-cy="submit-button-signup"]',
	// Dialogs
	invalidEmailOrPasswordDialog:
		'[data-cy="invalid-email-or-password-dialog"]',
	loadingDialog: '[data-cy="loading-dialog"]',
}

export const pageNotFoundSelectors = {
	homeLink: '[data-cy="home-link"]',
}
