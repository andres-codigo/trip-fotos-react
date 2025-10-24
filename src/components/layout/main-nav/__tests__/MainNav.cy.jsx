import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PropTypes from 'prop-types'

import '../../../../../cypress/support/commands'

import { PAGE_SELECTORS } from '../../../../../cypress/support/constants/selectors/pages'
import { topNavigationSelectors } from '../../../../../cypress/support/constants/selectors'
import { APP_URLS } from '../../../../../cypress/support/constants/api/urls'

import { viewports } from '../../../../../cypress/support/constants/viewports'

import { TestMainNav } from './test-utilities/mainNavTestUtils'
import {
	mockUseMainNavState,
	assertMenuItems,
	assertMenuItemRedirect,
} from './test-utilities/mainNavTestHelpers'
import TestLocationDisplay from '../../../../testUtils/cypress/TestLocationDisplay'

import MessagesPage from '../../../../pages/messages/Messages'
import TravellersPage from '../../../../pages/travellers/Travellers'
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
				it('redirects to Messages page when Messages is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_MESSAGES,
							viewports.mobile,
							topNavigationSelectors.navMenuItemMessages,
							PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Travellers page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_TRAVELLERS,
							viewports.mobile,
							topNavigationSelectors.navMenuItemTravellers,
							PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER,
							TravellersPage,
							store,
						)
					})
				})

				it('redirects to Authentication page and closes menu when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_AUTHENTICATION,
							viewports.mobile,
							topNavigationSelectors.navMenuItemLogout,
							PAGE_SELECTORS.AUTHENTICATION_MAIN_CONTAINER,
							AuthenticationPage,
							store,
						)
					})
				})

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

				it('closes the hamburger menu when Messages link is clicked on mobile', () => {
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

						cy.get(
							topNavigationSelectors.navMenuItemMessages,
						).click()

						cy.get(
							topNavigationSelectors.navMenuItemsContainer,
						).should('not.have.class', mainNavStyles.active)
					})
				})

				it('closes the hamburger menu when Travellers link is clicked on mobile', () => {
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

						cy.get(
							topNavigationSelectors.navMenuItemTravellers,
						).click()

						cy.get(
							topNavigationSelectors.navMenuItemsContainer,
						).should('not.have.class', mainNavStyles.active)
					})
				})

				it('hamburger menu does not exist when user is not logged in', () => {
					cy.createMockStore('mock-token').then((store) => {
						cy.mountWithProviders(
							<TestMainNav isLoggedIn={false} />,
							store,
						)
						cy.setViewportToMobile()

						cy.get(topNavigationSelectors.navMenuContainer).should(
							'not.exist',
						)
						cy.get(topNavigationSelectors.navHamburgerMenu).should(
							'not.exist',
						)
					})
				})
			})

			describe('Tablet', () => {
				it('redirects to Messages page when Messages is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_MESSAGES,
							viewports.tablet,
							topNavigationSelectors.navMenuItemMessages,
							PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Travellers page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_TRAVELLERS,
							viewports.tablet,
							topNavigationSelectors.navMenuItemTravellers,
							PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER,
							TravellersPage,
							store,
						)
					})
				})

				it('redirects to Authentication page when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_AUTHENTICATION,
							viewports.tablet,
							topNavigationSelectors.navMenuItemLogout,
							PAGE_SELECTORS.AUTHENTICATION_MAIN_CONTAINER,
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
							APP_URLS.CY_MESSAGES,
							viewports.desktop,
							topNavigationSelectors.navMenuItemMessages,
							PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER,
							MessagesPage,
							store,
						)
					})
				})

				it('redirects to Travellers page when Travellers is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_TRAVELLERS,
							viewports.desktop,
							topNavigationSelectors.navMenuItemTravellers,
							PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER,
							TravellersPage,
							store,
						)
					})
				})

				it('redirects to Authentication page when Logout is clicked', () => {
					cy.createMockStore('mock-token').then((store) => {
						assertMenuItemRedirectWithDefaults(
							APP_URLS.CY_AUTHENTICATION,
							viewports.desktop,
							topNavigationSelectors.navMenuItemLogout,
							PAGE_SELECTORS.AUTHENTICATION_MAIN_CONTAINER,
							AuthenticationPage,
							store,
						)
					})
				})
			})
		})
	})

	describe('Accessibility tests', () => {
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
