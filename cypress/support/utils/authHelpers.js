import { DATABASE } from '../constants/api/database'
import { APP_URLS, SDK_METHOD_TYPE_URLS } from '../constants/api/urls'
import { user } from '../constants/users'

/**
 * Performs login flow and waits for successful authentication
 * @param {string} email - User email (defaults to valid user email)
 * @param {string} password - User password (defaults to valid user password)
 * @param {string} expectedRedirectUrl - Expected URL after login (defaults to home)
 */
export const performLogin = (
	email = user.validEmail,
	password = user.validPassword,
	expectedRedirectUrl = APP_URLS.CY_HOME,
) => {
	cy.interceptLogin(DATABASE.POST, SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD)
	cy.login(email, password)
	cy.wait('@loginRequest')
	cy.url().should('include', expectedRedirectUrl)
}

/**
 * Navigates to login page and performs authentication
 * @param {string} email - User email (defaults to valid user email)
 * @param {string} password - User password (defaults to valid user password)
 */
export const loginAndNavigateToHome = (
	email = user.validEmail,
	password = user.validPassword,
) => {
	cy.visit(APP_URLS.CY_AUTHENTICATION) // Assuming auth route exists
	performLogin(email, password)
}
