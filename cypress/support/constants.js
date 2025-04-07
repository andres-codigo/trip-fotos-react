export const user = {
	email: Cypress.env('user_email'),
	password: Cypress.env('user_password'),
	validEmail: 'valid@email.com',
	invalidEmail: 'invalid@email',
};

export const baseUrl = Cypress.config('baseUrl');

export const urls = {
	cyAuth: baseUrl,
};

export const domAttributeUrls = {
	root: Cypress.env('root_url'),
};

export const topNavigationSelectors = {
	navHeaderContainer: '[data-cy="nav-header-container"]',
	navHeaderTitleLink: '[data-cy="nav-header-title-link"]',
	navMenuItemMessages: '[data-cy="nav-menu-item-messages"]',
	totalMessages: '[data-cy="total-messages"]',
	navMenuItemAllTravellers: '[data-cy="nav-menu-item-all-travellers"]',
	navMenuItemLogin: '[data-cy="nav-menu-item-login"]',
	navMenuItemLogout: '[data-cy="nav-menu-item-logout"]',
};
