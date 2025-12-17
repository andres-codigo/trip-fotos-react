import { API_DATABASE } from '../../../src/constants/api'
import { PATHS } from '../../../src/constants/ui/paths'
import { SDK_METHOD_TYPE_URLS } from '../constants/api/urls'
import { TEST_USER } from '../constants/env/test-users'

/**
 * Performs login flow and waits for successful authentication
 * @param {string} email - User email (defaults to valid user email)
 * @param {string} password - User password (defaults to valid user password)
 * @param {string} expectedRedirectUrl - Expected URL after login (defaults to home)
 */
export const performLogin = (
	email = TEST_USER.VALID_EMAIL,
	password = TEST_USER.VALID_PASSWORD,
	expectedRedirectUrl = PATHS.HOME,
) => {
	cy.interceptLogin(
		API_DATABASE.POST,
		SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
	)
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
	email = TEST_USER.VALID_EMAIL,
	password = TEST_USER.VALID_PASSWORD,
) => {
	cy.visit(PATHS.AUTHENTICATION) // Assuming auth route exists
	performLogin(email, password)
}
