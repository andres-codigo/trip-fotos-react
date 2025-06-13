import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PropTypes from 'prop-types'
import configureStore from 'redux-mock-store'

import {
	urls,
	viewports,
	topNavigationSelectors,
	pageSelectors,
} from '../../../../../cypress/support/constants'

import '../../../../../cypress/support/commands'

import { TestMainNav } from './mainNavTestUtils'
import {
	mockUseMainNavState,
	assertMenuItems,
	mountWithProviders,
	assertMenuItemRedirect,
} from './mainNavTestHelpers'
import TestLocationDisplay from '../../../../testUtils/cypress/TestLocationDisplay'

import MessagesPage from '../../../../pages/messages/Messages'
import TripsPage from '../../../../pages/trips/Trips'
import AuthenticationPage from '../../../../pages/authentication/UserAuth'

import mainNavStyles from '../MainNav.module.scss'

const mockStore = configureStore([])

const initialState = {
	authentication: { token: 'mock-token' },
}
let store

beforeEach(() => {
	store = mockStore(initialState)
})

const assertMenuItemRedirectWithDefaults = (
	routePath,
	viewportType,
	navMenuItem,
	locationPageClassName,
	PageComponent,
) => {
	assertMenuItemRedirect(
		store,
		routePath,
		viewportType,
		navMenuItem,
		locationPageClassName,
		PageComponent,
		TestMainNav,
		TestLocationDisplay,
		Provider,
		MemoryRouter,
		Routes,
		Route,
	)
}

describe('<MainNav />', () => {
	describe('Rendering tests', () => {
		it('does not render nav when not logged in', () => {
			mountWithProviders(<TestMainNav isLoggedIn={false} />, store)
			cy.get(topNavigationSelectors.navMenuContainer).should('not.exist')
		})

		describe('Mobile', () => {
			it('renders menu items and hamburger menu when logged in', () => {
				mountWithProviders(
					<TestMainNav
						isLoggedIn={true}
						isMenuOpen={true}
					/>,
					store,
				)
				cy.setViewportToMobile()
				cy.get(topNavigationSelectors.navMenuContainer)
					.should('exist')
					.and('be.visible')
				cy.get(topNavigationSelectors.navHamburgerMenu)
					.should('exist')
					.and('be.visible')
				assertMenuItems(mockUseMainNavState().travellerName)
			})
		})

		describe('Tablet', () => {
			it('renders menu items when logged in', () => {
				mountWithProviders(
					<TestMainNav
						isLoggedIn={true}
						isMenuOpen={true}
					/>,
					store,
				)
				cy.setViewportToTablet()
				cy.get(topNavigationSelectors.navMenuContainer)
					.should('exist')
					.and('be.visible')
				cy.get(topNavigationSelectors.navHamburgerMenu).should(
					'not.be.visible',
				)
				assertMenuItems(mockUseMainNavState().travellerName)
			})
		})

		describe('Desktop', () => {
			it('renders menu items when logged in', () => {
				mountWithProviders(
					<TestMainNav
						isLoggedIn={true}
						isMenuOpen={true}
					/>,
					store,
				)
				cy.setViewportToTablet()
				cy.get(topNavigationSelectors.navMenuContainer)
					.should('exist')
					.and('be.visible')
				cy.get(topNavigationSelectors.navHamburgerMenu).should(
					'not.be.visible',
				)
				assertMenuItems(mockUseMainNavState().travellerName)
			})
		})
	})

	describe('Behaviour tests', () => {
		describe('Mobile', () => {
			it('opens and closes the hamburger menu on mobile when clicking outside', () => {
				mountWithProviders(
					<TestMainNav
						isLoggedIn={true}
						isMenuOpen={true}
					/>,
					store,
				)
				cy.setViewportToMobile()
				cy.get(topNavigationSelectors.navMenuItemsContainer).should(
					'have.class',
					mainNavStyles.active,
				)
				cy.get('body').click(0, 0)
				cy.get(topNavigationSelectors.navMenuItemsContainer).should(
					'not.have.class',
					mainNavStyles.active,
				)
			})

			it('redirects to Messages page when Messages is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyMessages,
					viewports.mobile,
					topNavigationSelectors.navMenuItemMessages,
					pageSelectors.messagesPage,
					MessagesPage,
				)
			})

			it('redirects to Trips page when Travellers is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyTrips,
					viewports.mobile,
					topNavigationSelectors.navMenuItemTravellers,
					pageSelectors.tripsPage,
					TripsPage,
				)
			})

			it('redirects to Authentication page when Logout is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyAuth,
					viewports.mobile,
					topNavigationSelectors.navMenuItemLogout,
					pageSelectors.authenticationPage,
					AuthenticationPage,
				)
			})
		})

		describe('Tablet', () => {
			it('redirects to Messages page when Messages is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyMessages,
					viewports.tablet,
					topNavigationSelectors.navMenuItemMessages,
					pageSelectors.messagesPage,
					MessagesPage,
				)
			})

			it('redirects to Trips page when Travellers is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyTrips,
					viewports.tablet,
					topNavigationSelectors.navMenuItemTravellers,
					pageSelectors.tripsPage,
					TripsPage,
				)
			})

			it('redirects to Authentication page when Logout is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyAuth,
					viewports.tablet,
					topNavigationSelectors.navMenuItemLogout,
					pageSelectors.authenticationPage,
					AuthenticationPage,
				)
			})
		})

		describe('Desktop', () => {
			it('redirects to Messages page when Messages is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyMessages,
					viewports.desktop,
					topNavigationSelectors.navMenuItemMessages,
					pageSelectors.messagesPage,
					MessagesPage,
				)
			})

			it('redirects to Trips page when Travellers is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyTrips,
					viewports.desktop,
					topNavigationSelectors.navMenuItemTravellers,
					pageSelectors.tripsPage,
					TripsPage,
				)
			})

			it('redirects to Authentication page when Logout is clicked', () => {
				assertMenuItemRedirectWithDefaults(
					urls.cyAuth,
					viewports.desktop,
					topNavigationSelectors.navMenuItemLogout,
					pageSelectors.authenticationPage,
					AuthenticationPage,
				)
			})
		})
	})

	describe('Accessibility tests', () => {})
})

TestMainNav.propTypes = {
	isLoggedIn: PropTypes.bool,
	isMenuOpen: PropTypes.bool,
}
