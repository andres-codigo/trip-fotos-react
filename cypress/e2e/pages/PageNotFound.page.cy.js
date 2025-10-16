import {
	headerSelectors,
	pageNotFoundSelectors,
} from '../../support/constants/selectors'
import { baseUrl, urls } from '../../support/constants/urls'
import { user } from '../../support/constants/users'

describe('Logged in > PageNotFound page', () => {
	const loginUrl = baseUrl + urls.cyAuth

	beforeEach(() => {
		cy.visit(loginUrl)
		cy.login(user.validEmail, user.validPassword)
	})
	it('displays the 404 page and user can navigate to the travellers page', () => {
		cy.url().should('eq', baseUrl + urls.cyTravellers)
		// // Visit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', baseUrl + urls.cyPageNotFound)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(headerSelectors.siteHeaderTitleLink).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', urls.cyHome)

		// Click the back to home link and verify url
		cy.get(pageNotFoundSelectors.homeLink).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', baseUrl + urls.cyTravellers)

		// Revisit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('displays the 404 page and user can only navigate to the authentication page', () => {
		const loginUrl = baseUrl + urls.cyAuth

		cy.visit(baseUrl)

		// // Visit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', baseUrl + urls.cyPageNotFound)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(headerSelectors.siteHeaderTitleLink).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', urls.cyAuth)

		// Click the back to home link and verify url
		cy.get(pageNotFoundSelectors.homeLink).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', loginUrl)

		// Revisit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })
	})
})
