import { baseUrl, urls } from '../../support/constants/api'

import {
	user,
	headerSelectors,
	topNavigationSelectors,
} from '../../support/constants'

describe('Viewport Desktop > Not Logged in > Top Navigation Rendering Tests', () => {
	beforeEach(() => {
		cy.visit(baseUrl + urls.cyAuth)
	})

	it('Displays the title as a link and does not render the hamburger menu', () => {
		cy.setViewportToDesktop()
		cy.assertHeaderTitleLink()

		cy.get(topNavigationSelectors.navHamburgerMenu).should('not.exist')
	})

	it('Navigates to the "authentication" page when clicking the app title', () => {
		cy.get(headerSelectors.siteHeaderTitleLink).click()
		cy.url().should('eq', baseUrl + urls.cyAuth)
	})
})

describe('Viewport Mobile > Logged in > Top Navigation Rendering Tests', () => {
	beforeEach(() => {
		cy.visit(baseUrl + urls.cyAuth)
		cy.login(user.validEmail, user.validPassword)
	})

	it('Displays the title as a link and renders the hamburger menu', () => {
		cy.setViewportToMobile()
		cy.assertHeaderTitleLink()

		cy.get(topNavigationSelectors.navHamburgerMenu).should('exist')
	})

	it('Navigates to the "trips" page when clicking the app title', () => {
		cy.get(headerSelectors.siteHeaderTitleLink).click()
		cy.url().should('eq', baseUrl + urls.cyTrips)
	})

	it('Toggles the hamburger menu open and closed on mobile viewports', () => {
		cy.setViewportToMobile()

		cy.get(headerSelectors.siteHeader).as('header')
		cy.get('@header')
			.find(topNavigationSelectors.navHamburgerMenu)
			.as('hamburgerMenu')

		// Ensure the menu is initially closed
		cy.assertHamburgerMenuState(false)

		// Click to open the menu
		cy.get('@hamburgerMenu').click()
		cy.assertHamburgerMenuState(true)

		// Click to close the menu
		cy.get('@hamburgerMenu').click()
		cy.assertHamburgerMenuState(false)
	})
})
