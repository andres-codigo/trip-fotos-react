import {
	baseUrl,
	urls,
	topNavigationSelectors,
	pageNotFoundSelectors,
} from '../../support/constants'

describe('PageNotFound page', () => {
	it('displays the 404 page and user can navigate home', () => {
		// Visit a non-existent route
		cy.visit(urls.cyNonExistentRoute, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', baseUrl + urls.cyPageNotFound)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(topNavigationSelectors.siteHeaderTitleLink).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', urls.cyAuth)

		// Click the back to home link and verify url
		cy.get(pageNotFoundSelectors.homeLink).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', baseUrl + urls.cyAuth)

		// Revisit a non-existent route
		cy.visit(urls.cyNonExistentRoute, { failOnStatusCode: false })
	})
})
