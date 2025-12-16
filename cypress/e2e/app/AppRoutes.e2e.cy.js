import { API_DATABASE } from '../../../src/constants/api'
import {
	BASE_URL,
	APP_URLS,
	SDK_METHOD_TYPE_URLS,
} from '../../support/constants/api/urls'
import { AUTHENTICATION_FORM_SELECTORS } from '../../support/constants/selectors/components'
import { TEST_USER } from '../../support/constants/env/test-users'

describe('App Routing', () => {
	it('redirects unauthenticated users from protected routes to login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_TRAVELLERS)
		cy.url().should('include', APP_URLS.CY_AUTHENTICATION)
	})

	it('allows access to the authentication page', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'exist',
		)
	})

	it('redirects to home after successful login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USER.VALID_EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USER.VALID_PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.url({ timeout: 10000 }).should('include', APP_URLS.CY_HOME)
	})

	it('allows access to protected routes after login', () => {
		cy.visit(BASE_URL + APP_URLS.CY_AUTHENTICATION)
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		).as('loginRequest')
		cy.login(TEST_USER.VALID_EMAIL, TEST_USER.VALID_PASSWORD)

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
