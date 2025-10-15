import { apiDatabase, apiUrls } from '../constants/api'
import { urls } from '../constants/urls'
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
	expectedRedirectUrl = urls.cyHome,
) => {
	cy.interceptLogin(apiDatabase.POST, apiUrls.signInWithPassword)
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
	cy.visit('/auth') // Assuming auth route exists
	performLogin(email, password)
}
