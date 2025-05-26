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
	email: Cypress.env('USER_EMAIL'),
	password: Cypress.env('USER_PASSWORD'),
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
	emailInput: '[data-cy="email-input"]',
	passwordInput: '[data-cy="password-input"]',
	submitButtonLogin: '[data-cy="submit-button-login"]',
	submitButtonSignup: '[data-cy="submit-button-signup"]',
}

export const pageNotFoundSelectors = {
	homeLink: '[data-cy="home-link"]',
}
