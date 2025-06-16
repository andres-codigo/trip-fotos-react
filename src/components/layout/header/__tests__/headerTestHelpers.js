import {
	headerSelectors,
	topNavigationSelectors,
} from '../../../../../cypress/support/constants/selectors'

export const assertHeaderTitleLink = (expectedHref) => {
	cy.get(headerSelectors.siteHeaderTitleLink)
		.should('exist')
		.find('a')
		.should('have.attr', 'href', expectedHref)
		.and('contain.text', 'Trip Fotos')
}

export const assertNavMenu = ({ shouldExist, shouldBeVisible }) => {
	const navMenu = cy.get(topNavigationSelectors.navMenuContainer)
	if (shouldExist) {
		navMenu.should('exist')
		const navMenuItems = cy.get(
			topNavigationSelectors.navMenuItemsContainer,
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
	const hamburgerMenu = cy.get(topNavigationSelectors.navHamburgerMenu)
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
