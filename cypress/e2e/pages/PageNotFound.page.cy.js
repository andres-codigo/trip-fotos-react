import { PAGE_NOT_FOUND_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { HEADER_SELECTORS } from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { TEST_USERS } from '../../../src/constants/config/users'

describe('Logged in > PageNotFound page', () => {
	const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

	beforeEach(() => {
		cy.visit(loginUrl)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)
	})
	it('displays the 404 page and user can navigate to the travellers page', () => {
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.TRAVELLERS)
		// // Visit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', PATHS.HOME)

		// Click the back to home link and verify url
		cy.get(PAGE_NOT_FOUND_SELECTORS.HOME_LINK).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.TRAVELLERS)

		// Revisit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('displays the 404 page and user can only navigate to the authentication page', () => {
		const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

		cy.visit(BASE_URL_CYPRESS)

		// // Visit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header')
			.find('a')
			.should('have.attr', 'href', PATHS.AUTHENTICATION)

		// Click the back to home link and verify url
		cy.get(PAGE_NOT_FOUND_SELECTORS.HOME_LINK).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', loginUrl)

		// Revisit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
	})
})
