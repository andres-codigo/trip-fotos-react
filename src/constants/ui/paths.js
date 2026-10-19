const isCypress = typeof Cypress !== 'undefined'

export const BASE_URL_CYPRESS = isCypress && Cypress.config('baseUrl')

export const PATHS = Object.freeze({
	// PATHS
	HOME: '/',
	AUTHENTICATION: '/authentication',
	TRAVELLERS: '/travellers',
	TRAVELLER_DETAIL: '/travellers/:id',
	CONTACT_TRAVELLER: '/travellers/:id/contact',
	REGISTER: '/register',
	MESSAGES: '/messages',
	PRIVACY: '/privacy',
	PAGE_NOT_FOUND: '/404',
	// TEST PATHS
	NON_EXISTENT_PATH: '/cy-non-existent-route',
})
