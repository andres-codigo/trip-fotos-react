import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PropTypes from 'prop-types'

import { urls } from '../../../../../cypress/support/constants/api'

import { viewports } from '../../../../../cypress/support/constants/viewports'

import {
	topNavigationSelectors,
	pageSelectors,
} from '../../../../../cypress/support/constants'

import '../../../../../cypress/support/commands'

import { TestMainNav } from './mainNavTestUtils'
import {
	mockUseMainNavState,
	assertMenuItems,
	assertMenuItemRedirect,
} from './mainNavTestHelpers'
import TestLocationDisplay from '../../../../testUtils/cypress/TestLocationDisplay'

import MessagesPage from '../../../../pages/messages/Messages'
import TripsPage from '../../../../pages/trips/Trips'
import AuthenticationPage from '../../../../pages/authentication/UserAuth'

import mainNavStyles from '../MainNav.module.scss'

const assertMenuItemRedirectWithDefaults = (
	routePath,
	viewportType,
	navMenuItem,
	locationPageClassName,
	PageComponent,
	store,
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
		describe('Not logged in', () => {
			it('does not render nav', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav isLoggedIn={false} />,
						store,
					)
					cy.get(topNavigationSelectors.navMenuContainer).should(
						'not.exist',
					)
				})
			})
		})

		describe('Logged in', () => {
			describe('Mobile', () => {
				it('renders menu items and hamburger menu when logged in', () => {
					cy.createMockStore('mock-token').then((store) => {
						cy.mountWithProviders(
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
			})

			describe('Tablet', () => {
				it('renders menu items when logged in', () => {
					cy.createMockStore('mock-token').then((store) => {
						cy.mountWithProviders(
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

			describe('Desktop', () => {
				it('renders menu items when logged in', () => {
					cy.createMockStore('mock-token').then((store) => {
						cy.mountWithProviders(
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
		})
	})

	describe('Behaviour tests', () => {
		describe('Logged in', () => {
			describe('Mobile', () => {
				it('opens and closes the hamburger menu on mobile when clicking outside', () => {
					cy.createMockStore('mock-token').then((store) => {
						cy.mountWithProviders(
							<TestMainNav
								isLoggedIn={true}
								isMenuOpen={true}
							/>,
							store,
						)
						cy.setViewportToMobile()
						cy.get(
							topNavigationSelectors.navMenuItemsContainer,
						).should('have.class', mainNavStyles.active)
						cy.get('body').click(0, 0)
						cy.get(
							topNavigationSelectors.navMenuItemsContainer,
						).should('not.have.class', mainNavStyles.active)
					})
				})

				it('redirects to Messages page when Messages is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyMessages,
							viewports.mobile,
							topNavigationSelectors.navMenuItemMessages,
							pageSelectors.messagesPage,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Trips page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyTrips,
							viewports.mobile,
							topNavigationSelectors.navMenuItemTravellers,
							pageSelectors.tripsPage,
							TripsPage,
							store,
						)
					})
				})

				it('redirects to Authentication page when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyAuth,
							viewports.mobile,
							topNavigationSelectors.navMenuItemLogout,
							pageSelectors.authenticationPage,
							AuthenticationPage,
							store,
						)
					})
				})
			})

			describe('Tablet', () => {
				it('redirects to Messages page when Messages is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyMessages,
							viewports.tablet,
							topNavigationSelectors.navMenuItemMessages,
							pageSelectors.messagesPage,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Trips page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyTrips,
							viewports.tablet,
							topNavigationSelectors.navMenuItemTravellers,
							pageSelectors.tripsPage,
							TripsPage,
							store,
						)
					})
				})

				it('redirects to Authentication page when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyAuth,
							viewports.tablet,
							topNavigationSelectors.navMenuItemLogout,
							pageSelectors.authenticationPage,
							AuthenticationPage,
							store,
						)
					})
				})
			})

			describe('Desktop', () => {
				it('redirects to Messages page when Messages is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyMessages,
							viewports.desktop,
							topNavigationSelectors.navMenuItemMessages,
							pageSelectors.messagesPage,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Trips page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyTrips,
							viewports.desktop,
							topNavigationSelectors.navMenuItemTravellers,
							pageSelectors.tripsPage,
							TripsPage,
							store,
						)
					})
				})

				it('redirects to Authentication page when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							urls.cyAuth,
							viewports.desktop,
							topNavigationSelectors.navMenuItemLogout,
							pageSelectors.authenticationPage,
							AuthenticationPage,
							store,
						)
					})
				})
			})
		})
	})

	describe.only('Accessibility tests', () => {
		describe('Logged in', () => {
			it('nav has appropriate aria-label and role', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>,
						store,
					)
					cy.get(topNavigationSelectors.navMenuContainer)
						.should('have.attr', 'aria-label', 'Top navigation')
						.and('have.attr', 'role', 'navigation')
				})
			})

			it('hamburger menu button has correct aria attributes', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>,
						store,
					)
					cy.get(topNavigationSelectors.navHamburgerMenu)
						.should(
							'have.attr',
							'aria-controls',
							'hamburger-menu-items-container',
						)
						.and('have.attr', 'aria-expanded', 'true')
						.and('have.attr', 'aria-label', 'Close navigation menu')
				})
			})

			it('menu items container has id and data-cy, and aria-label', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>,
						store,
					)
					cy.get(topNavigationSelectors.navMenuItemsContainer)
						.should('have.attr', 'id', 'nav-menu-items-container')
						.and('have.attr', 'aria-label', 'Main navigation menu')
				})
			})

			it('logout button is accessible by role and label', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>,
						store,
					)
					cy.get(topNavigationSelectors.navMenuItemLogout)
						.should('exist')
						.and('contain.text', 'Logout')
				})
			})

			it('all interactive elements are focusable', () => {
				cy.createMockStore('mock-token').then((store) => {
					cy.mountWithProviders(
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>,
						store,
					)
					cy.get(topNavigationSelectors.navHamburgerMenu)
						.focus()
						.should('have.focus')
					cy.get(
						`${topNavigationSelectors.navMenuItemsContainer} a`,
					).each(($el) => {
						cy.wrap($el).focus().should('have.focus')
					})
				})
			})
		})
	})
})

TestMainNav.propTypes = {
	isLoggedIn: PropTypes.bool,
	isMenuOpen: PropTypes.bool,
}
