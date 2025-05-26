import {
	baseUrl,
	urls,
	user,
	topNavigationSelectors,
	pageNotFoundSelectors,
} from '../../support/constants'

describe('Logged in > PageNotFound page', () => {
	beforeEach(() => {
		cy.visit(baseUrl + urls.cyAuth)
		cy.login(user.email, user.password)
	})
	it('displays the 404 page and user can navigate to the home page', () => {
		cy.url().should('eq', baseUrl + urls.cyTrips)
		// // Visit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })

		// Check the 404 Page Not Found Page URL is correct
		cy.url().should('eq', baseUrl + urls.cyPageNotFound)

		// Check for the 404 message
		cy.contains('This page is not available. Sorry about that.').should(
			'be.visible',
		)

		// Check App title link is present and has the correct href
		cy.get(topNavigationSelectors.siteHeaderTitleLink).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', urls.cyTrips)

		// Click the back to home link and verify url
		cy.get(pageNotFoundSelectors.homeLink).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', baseUrl + urls.cyTrips)

		// Revisit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('displays the 404 page and user can only navigate to the authentication page', () => {
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
		cy.get(topNavigationSelectors.siteHeaderTitleLink).as('header')
		cy.get('@header').find('a').should('have.attr', 'href', urls.cyAuth)

		// Click the back to home link and verify url
		cy.get(pageNotFoundSelectors.homeLink).as('homeLink')
		cy.get('@homeLink').click()
		cy.url().should('eq', baseUrl + urls.cyAuth)

		// Revisit a non-existent route
		cy.visit(urls.cyNonExistentPath, { failOnStatusCode: false })
	})
})
