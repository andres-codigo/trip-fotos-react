import { PAGE_NOT_FOUND_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { HEADER_SELECTORS } from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { performLogin } from '../../support/utils/authHelpers'

describe('Logged in > PageNotFound page', () => {
	const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

	beforeEach(() => {
		cy.visit(loginUrl)
		performLogin()
	})
	it('displays the 404 page and user can go on to Travellers', () => {
		cy.location('pathname').should('be.oneOf', [
			PATHS.HOME,
			PATHS.TRAVELLERS,
		])
		// Visit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available.').should('be.visible')

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header')
			.find('a')
			.should('have.attr', 'href', PATHS.TRAVELLERS)

		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION)
			.should('have.text', 'Go to Travellers')
			.click()
		cy.location('pathname').should('eq', PATHS.TRAVELLERS)

		// Revisit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)
	})
})

describe('Not logged in > PageNotFound page styling', () => {
	it('offers Log in as a primary button', () => {
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION)
			.should('have.text', 'Log in')
			.and('have.attr', 'href', PATHS.AUTHENTICATION)
			.and('have.css', 'background-color', 'rgb(159, 192, 126)')
			.invoke('outerHeight')
			.should('be.at.least', 44)
	})
})

describe('Not logged in > PageNotFound page accessibility', () => {
	it('has no axe violations', () => {
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)
		cy.contains('This page is not available.').should('be.visible')

		cy.checkA11y()
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('displays the 404 page, its Log in action and the brand link to Travellers', () => {
		const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

		cy.visit(BASE_URL_CYPRESS)

		// Visit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)

		// Check for the 404 message
		cy.contains('This page is not available.').should('be.visible')

		// Check App title link is present and has the correct href
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).as('header')
		cy.get('@header')
			.find('a')
			.should('have.attr', 'href', PATHS.TRAVELLERS)

		// Click the back to home link and verify url
		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', loginUrl)

		// Revisit a non-existent route
		cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)
	})
})
