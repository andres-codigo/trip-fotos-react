import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import { PATHS } from '../../../src/constants/ui/paths'
import { TEST_USERS } from '../../../src/constants/config/users'

const REQUEST_TIMEOUT = 10000

export const performLogin = (
	email = TEST_USERS.STANDARD.EMAIL,
	password = TEST_USERS.STANDARD.PASSWORD,
	expectedRedirectUrl = PATHS.HOME,
) => {
	cy.session(
		`user-session-${email}`,
		() => {
			cy.visit(PATHS.AUTHENTICATION)
			cy.interceptLogin(
				API_DATABASE.POST,
				SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			)
			cy.login(email, password)
			cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
			// The Auth SDK makes a follow-up call before the session is stored, so wait for it before cy.session snapshots storage
			cy.window({ timeout: REQUEST_TIMEOUT }).should((win) => {
				expect(win.localStorage.getItem('token')).to.be.a('string')
			})
			cy.url({ timeout: REQUEST_TIMEOUT }).should('include', PATHS.HOME)
		},
		{
			validate() {
				cy.visit(PATHS.TRAVELLERS)
				cy.url({ timeout: REQUEST_TIMEOUT }).should(
					'not.include',
					PATHS.AUTHENTICATION,
				)
			},
		},
	)

	cy.visit(expectedRedirectUrl)
	cy.url({ timeout: REQUEST_TIMEOUT }).should('include', expectedRedirectUrl)
}

export const loginAndNavigateToHome = (
	email = TEST_USERS.STANDARD.EMAIL,
	password = TEST_USERS.STANDARD.PASSWORD,
) => {
	cy.visit(PATHS.AUTHENTICATION) // Assuming auth route exists
	performLogin(email, password)
}
