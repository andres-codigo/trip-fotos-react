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

function assertHeaderForViewport({
	viewportFn,
	expectedHref,
	navMenuShouldExist,
	navMenuShouldBeVisible,
	hamburgerMenuShouldExist = false,
}) {
	viewportFn()
	cy.get(headerSelectors.siteHeaderTitleLink)
		.should('exist')
		.find('a')
		.should('have.attr', 'href', expectedHref)
		.and('contain.text', 'Trip Fotos')

	const navMenu = cy.get(topNavigationSelectors.navMenuContainer)

	if (navMenuShouldExist) {
		navMenu.should('exist')

		const navMenuItems = cy.get(
			topNavigationSelectors.navMenuItemsContainer,
		)

		if (navMenuShouldBeVisible) {
			navMenuItems.should('be.visible')
		} else {
			navMenuItems.should('not.be.visible')

			const hamburgerMenu = cy.get(
				topNavigationSelectors.navHamburgerMenu,
			)
			if (hamburgerMenuShouldExist) {
				hamburgerMenu.should('exist')
			} else {
				hamburgerMenu.should('not.exist')
			}
		}
	} else {
		navMenu.should('not.exist')
	}
}

describe('<Header />', () => {
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

		// Mobile
		assertHeaderForViewport({
			viewportFn: cy.setViewportToMobile,
			expectedHref: urls.cyAuth,
			navMenuShouldExist: false,
		})

		// Tablet
		assertHeaderForViewport({
			viewportFn: cy.setViewportToTablet,
			expectedHref: urls.cyAuth,
			navMenuShouldExist: false,
		})

		// Desktop
		assertHeaderForViewport({
			viewportFn: cy.setViewportToDesktop,
			expectedHref: urls.cyAuth,
			navMenuShouldExist: false,
		})
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

		// Mobile
		assertHeaderForViewport({
			viewportFn: cy.setViewportToMobile,
			expectedHref: urls.cyTrips,
			navMenuShouldExist: true,
			navMenuShouldBeVisible: false,
			hamburgerMenuShouldExist: true,
		})

		// Tablet
		assertHeaderForViewport({
			viewportFn: cy.setViewportToTablet,
			expectedHref: urls.cyTrips,
			navMenuShouldExist: true,
			navMenuShouldBeVisible: true,
			hamburgerMenuShouldExist: false,
		})

		// Desktop
		assertHeaderForViewport({
			viewportFn: cy.setViewportToDesktop,
			expectedHref: urls.cyTrips,
			navMenuShouldExist: true,
			navMenuShouldBeVisible: true,
			hamburgerMenuShouldExist: false,
		})
	})
})
