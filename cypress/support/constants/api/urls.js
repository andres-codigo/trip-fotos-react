import { API_DATABASE } from './endpoints'

export const BASE_URL = Cypress.config('baseUrl')

export const APP_URLS = {
	CY_HOME: Cypress.env('HOME_URL'),
	CY_AUTHENTICATION: Cypress.env('AUTHENTICATION_URL'),
	CY_TRAVELLERS: Cypress.env('TRAVELLERS_URL'),
	CY_REGISTER: Cypress.env('REGISTER_URL'),
	CY_MESSAGES: Cypress.env('MESSAGES_URL'),
	CY_PAGE_NOT_FOUND: Cypress.env('PAGENOTFOUND_URL'),
	CY_NON_EXISTENT_PATH: Cypress.env('NON_EXISTENT_URL'),
}

export const SDK_METHOD_TYPE_URLS = {
	SIGN_IN_WITH_PASSWORD: `${API_DATABASE.URL}signInWithPassword?key=${API_DATABASE.KEY}`,
}
