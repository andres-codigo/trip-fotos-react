import {
	HEADER_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '../../support/constants/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { TEST_USER } from '../../support/constants/env/test-users'

describe('Viewport Desktop > Not Logged in > Top Navigation Rendering Tests', () => {
	beforeEach(() => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	})

	it('Displays the title as a link and does not render the hamburger menu', () => {
		cy.setViewportToDesktop()
		cy.assertHeaderTitleLink()

		cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU).should('not.exist')
	})

	it('Navigates to the "authentication" page when clicking the app title', () => {
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).click()
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	})
})

describe('Viewport Mobile > Logged in > Top Navigation Rendering Tests', () => {
	beforeEach(() => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.login(TEST_USER.VALID_EMAIL, TEST_USER.VALID_PASSWORD)
	})

	it('Displays the title as a link and renders the hamburger menu', () => {
		cy.setViewportToMobile()
		cy.assertHeaderTitleLink()

		cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU).should('exist')
	})

	it('Navigates to the "home" page when clicking the app title', () => {
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).click()
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.HOME)
	})

	it('Toggles the hamburger menu open and closed on mobile viewports', () => {
		cy.setViewportToMobile()

		cy.get(HEADER_SELECTORS.SITE_HEADER).as('header')
		cy.get('@header')
			.find(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU)
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
