import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import {
	urls,
	headerSelectors,
	topNavigationSelectors,
} from '../../../../../cypress/support/constants'

import Header from '../Header'

import configureStore from 'redux-mock-store'

const mockStore = configureStore([])

const assertHeaderTitleLink = (expectedHref) => {
	cy.get(headerSelectors.siteHeaderTitleLink)
		.should('exist')
		.find('a')
		.should('have.attr', 'href', expectedHref)
		.and('contain.text', 'Trip Fotos')
}

const assertNavMenu = ({ shouldExist, shouldBeVisible }) => {
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

const assertHamburgerMenu = (shouldExist) => {
	const hamburgerMenu = cy.get(topNavigationSelectors.navHamburgerMenu)
	if (shouldExist) {
		hamburgerMenu.should('exist')
	} else {
		hamburgerMenu.should('not.exist')
	}
}

const headerAssertions = (
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

describe('<Header />', () => {
	describe('Rendering tests', () => {
		it('renders correctly for not logged in users on mobile, tablet, and desktop', () => {
			const store = mockStore({
				authentication: { token: null },
			})

			cy.mount(
				<Provider store={store}>
					<MemoryRouter>
						<Header />
					</MemoryRouter>
				</Provider>,
			)

			cy.setViewportToMobile()
			headerAssertions(urls.cyAuth, false, false, false)

			cy.setViewportToTablet()
			headerAssertions(urls.cyAuth, false, false, false)

			cy.setViewportToDesktop()
			headerAssertions(urls.cyAuth, false, false, false)
		})

		it('renders correctly for logged in users on mobile, tablet, and desktop', () => {
			const store = mockStore({
				authentication: { token: 'fake-token' },
			})

			cy.mount(
				<Provider store={store}>
					<MemoryRouter>
						<Header />
					</MemoryRouter>
				</Provider>,
			)

			cy.setViewportToMobile()
			headerAssertions(urls.cyTrips, true, false, true)

			cy.setViewportToTablet()
			headerAssertions(urls.cyTrips, true, true, true)

			cy.setViewportToDesktop()
			headerAssertions(urls.cyTrips, true, true, true)
		})
	})

	describe('Behaviour tests', () => {})

	describe('Accessibility tests', () => {})
})
