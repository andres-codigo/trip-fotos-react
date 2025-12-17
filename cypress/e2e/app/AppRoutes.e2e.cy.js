import { API_DATABASE } from '../../../src/constants/api'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { SDK_METHOD_TYPE_URLS } from '../../support/constants/api/urls'
import { AUTHENTICATION_FORM_SELECTORS } from '../../../src/constants/test/selectors/components'
import { TEST_USERS } from '../../../src/constants/config/users'

describe('App Routing', () => {
	it('redirects unauthenticated users from protected routes to login', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS)
		cy.url().should('include', PATHS.AUTHENTICATION)
	})

	it('allows access to the authentication page', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'exist',
		)
	})

	it('redirects to home after successful login', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.STANDARD.PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.url({ timeout: 10000 }).should('include', PATHS.HOME)
	})

	it('allows access to protected routes after login', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		).as('loginRequest')
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)

		cy.wait('@loginRequest')
		cy.visit(BASE_URL_CYPRESS + PATHS.MESSAGES)

		cy.url().should('include', PATHS.MESSAGES)
	})

	it('shows 404 page for unknown routes', () => {
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)

		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)
	})
})
