export const baseUrl = Cypress.config('baseUrl')

export const urls = {
	cyHome: Cypress.env('HOME_URL'),
	cyAuth: Cypress.env('AUTHENTICATION_URL'),
	cyTravellers: Cypress.env('TRAVELLERS_URL'),
	cyMessages: Cypress.env('MESSAGES_URL'),
	cyPageNotFound: Cypress.env('PAGENOTFOUND_URL'),
	cyNonExistentPath: Cypress.env('NON_EXISTENT_URL'),
}
