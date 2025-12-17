import {
	HEADER_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '../../../../../constants/test/selectors/components'

export const assertHeaderTitleLink = (expectedHref) => {
	cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK)
		.should('exist')
		.find('a')
		.should('have.attr', 'href', expectedHref)
		.and('contain.text', 'Trip Fotos')
}

export const assertNavMenu = ({ shouldExist, shouldBeVisible }) => {
	const navMenu = cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER)
	if (shouldExist) {
		navMenu.should('exist')
		const navMenuItems = cy.get(
			TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEMS_CONTAINER,
		)
		if (shouldBeVisible) {
			navMenuItems.should('be.visible')
		} else {
			navMenuItems.should('not.be.visible')
		}
	} else {
		navMenu.should('not.exist')
	}
}

export const assertHamburgerMenu = (shouldExist) => {
	const hamburgerMenu = cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU)
	if (shouldExist) {
		hamburgerMenu.should('exist')
	} else {
		hamburgerMenu.should('not.exist')
	}
}

export const headerAssertions = (
	expectedHref,
	navMenuExists,
	navMenuVisible,
	hamburgerMenuExists,
) => {
	assertHeaderTitleLink(expectedHref)
	assertNavMenu({
		shouldExist: navMenuExists,
		shouldBeVisible: navMenuVisible,
	})
	assertHamburgerMenu(hamburgerMenuExists)
}
