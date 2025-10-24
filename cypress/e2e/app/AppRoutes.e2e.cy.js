import { DATABASE } from '../../support/constants/api/database'
import {
	BASE_URL,
	APP_URLS,
	SDK_METHOD_TYPE_URLS,
} from '../../support/constants/api/urls'
import { authenticationFormSelectors } from '../../support/constants/selectors'
import { user } from '../../support/constants/users'

describe('App Routing', () => {
	it('redirects unauthenticated users from protected routes to login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_TRAVELLERS)
		cy.url().should('include', APP_URLS.CY_AUTHENTICATION)
	})

	it('allows access to the authentication page', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).should(
			'exist',
		)
	})

	it('redirects to home after successful login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput).type(
			user.validPassword,
		)
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
		cy.url({ timeout: 10000 }).should('include', APP_URLS.CY_HOME)
	})

	it('allows access to protected routes after login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.interceptLogin(
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		).as('loginRequest')
		cy.login(user.validEmail, user.validPassword)

		cy.wait('@loginRequest')
		cy.visit(BASE_URL + APP_URLS.CY_MESSAGES)

		cy.url().should('include', APP_URLS.CY_MESSAGES)
	})

	it('shows 404 page for unknown routes', () => {
		cy.visit(APP_URLS.CY_NON_EXISTENT_PATH, { failOnStatusCode: false })

		cy.url().should('eq', BASE_URL + APP_URLS.CY_PAGE_NOT_FOUND)

		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)
	})
})
