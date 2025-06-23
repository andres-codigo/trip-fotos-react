import { apiDatabase, apiUrls } from '../../support/constants/api'
import { baseUrl, urls } from '../../support/constants/urls'
import { authenticationFormSelectors } from '../../support/constants/selectors'
import { user } from '../../support/constants/users'

describe('App Routing', () => {
	it('redirects unauthenticated users from protected routes to login', () => {
		cy.visit(baseUrl + urls.cyTrips)
		cy.url().should('include', urls.cyAuth)
	})

	it('allows access to the authentication page', () => {
		cy.visit(baseUrl + urls.cyAuth)
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).should(
			'exist',
		)
	})

	it('redirects to home after successful login', () => {
		cy.visit(baseUrl + urls.cyAuth)
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput).type(
			user.validPassword,
		)
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
		cy.url({ timeout: 10000 }).should('include', urls.cyHome)
	})

	it('allows access to protected routes after login', () => {
		cy.visit(baseUrl + urls.cyAuth)
		cy.interceptLogin(apiDatabase.POST, apiUrls.signInWithPassword).as(
			'loginRequest',
		)
		cy.login(user.validEmail, user.validPassword)

		cy.wait('@loginRequest')
		cy.visit(baseUrl + urls.cyMessages)

		cy.url().should('include', urls.cyMessages)
	})

	it('shows 404 page for unknown routes', () => {
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })

		cy.url().should('eq', baseUrl + urls.cyPageNotFound)

		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)
	})
})
