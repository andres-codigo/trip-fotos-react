import {
	ACCOUNT_MENU_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '@/constants/test'

import Header from '@/components/layout/header/Header'

// The nav items sit in the header from the tablet width; on a phone the tab bar carries them
const assertNav = ({ exists, visible }) => {
	if (!exists) {
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER).should('not.exist')
		return
	}
	cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEMS_CONTAINER).should(
		visible ? 'be.visible' : 'not.be.visible',
	)
}

describe('<Header />', () => {
	it('shows the title and no navigation when logged out, on mobile, tablet and desktop', () => {
		cy.createMockStore(null).then((store) => {
			cy.mountWithProviders(<Header />, store)

			;['Mobile', 'Tablet', 'Desktop'].forEach((size) => {
				cy[`setViewportTo${size}`]()
				cy.assertHeaderTitleLink()
				assertNav({ exists: false })
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('not.exist')
			})
		})
	})

	it('shows the account menu, and the nav items from the tablet width, when logged in', () => {
		cy.createMockStore(true).then((store) => {
			cy.mountWithProviders(<Header />, store)

			;[
				['Mobile', false],
				['Tablet', true],
				['Desktop', true],
			].forEach(([size, navVisible]) => {
				cy[`setViewportTo${size}`]()
				cy.assertHeaderTitleLink()
				assertNav({ exists: true, visible: navVisible })
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('be.visible')
			})
		})
	})

	;[
		['logged out', null],
		['logged in', true],
	].forEach(([state, user]) => {
		it(`has no axe violations ${state}`, () => {
			cy.createMockStore(user).then((store) => {
				cy.mountWithProviders(<Header />, store)
				cy.assertHeaderTitleLink()
				cy.checkA11y()
			})
		})
	})
})
