import { PAGE_NOT_FOUND_SELECTORS } from '../../support/constants/selectors/pages'
import { HEADER_SELECTORS } from '../../support/constants/selectors/components'
import { BASE_URL, APP_URLS } from '../../support/constants/api/urls'
import { TEST_USER } from '../../support/constants/env/test-users'

describe('Logged in > PageNotFound page', () => {
	const loginUrl = BASE_URL + APP_URLS.CY_AUTHENTICATION

	beforeEach(() => {
		cy.visit(loginUrl)
		cy.login(TEST_USER.VALID_EMAIL, TEST_USER.VALID_PASSWORD)
	})
	it('displays the 404 page and user can navigate to the travellers page', () => {
		cy.url().should('eq', BASE_URL + APP_URLS.CY_TRAVELLERS)
		// // Visit a non-existent route
		cy.visit(APP_URLS.CY_NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL + APP_URLS.CY_PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header')
			.find('a')
			.should('have.attr', 'href', APP_URLS.CY_HOME)

		// Click the back to home link and verify url
		cy.get(PAGE_NOT_FOUND_SELECTORS.HOME_LINK).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', BASE_URL + APP_URLS.CY_TRAVELLERS)

		// Revisit a non-existent route
		cy.visit(APP_URLS.CY_NON_EXISTENT_PATH, { failOnStatusCode: false })
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('displays the 404 page and user can only navigate to the authentication page', () => {
		const loginUrl = BASE_URL + APP_URLS.CY_AUTHENTICATION

		cy.visit(BASE_URL)

		// // Visit a non-existent route
		cy.visit(APP_URLS.CY_NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL + APP_URLS.CY_PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header')
			.find('a')
			.should('have.attr', 'href', APP_URLS.CY_AUTHENTICATION)

		// Click the back to home link and verify url
		cy.get(PAGE_NOT_FOUND_SELECTORS.HOME_LINK).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', loginUrl)

		// Revisit a non-existent route
		cy.visit(APP_URLS.CY_NON_EXISTENT_PATH, { failOnStatusCode: false })
	})
})
