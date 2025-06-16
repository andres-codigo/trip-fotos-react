import { urls } from '../../../../../cypress/support/constants/api'

import { viewports } from '../../../../../cypress/support/constants/viewports'

import {
	testSelectors,
	topNavigationSelectors,
} from '../../../../../cypress/support/constants'

// TODO: Remove and import hooks once store slices are implemented
export const mockUseMainNavState = () => ({
	travellerName: 'Test User',
	// TODO: Add messages count when messages store is implemented
	// totalMessages: 5,
	useLogout: () => {},
})

export const assertMenuItems = (travellerName = 'Test User') => {
	cy.get(topNavigationSelectors.navMenuItemMessages)
		.should('exist')
		.and('be.visible')
		.should('have.attr', 'href', urls.cyMessages)
		.and('have.text', 'Messages')
	cy.get(topNavigationSelectors.navMenuItemTravellers)
		.should('exist')
		.and('be.visible')
		.find('a')
		.should('have.attr', 'href', urls.cyTrips)
		.and('have.text', 'Travellers')
	cy.get(topNavigationSelectors.navMenuItemLogout)
		.should('exist')
		.and('be.visible')
		.and('have.text', `Logout ${travellerName}`)
}

export const assertMenuItemRedirect = (
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
) => {
	cy.mountWithProviders(
		// LocationDisplay MUST be outside of <Routes> to be always rendered
		<>
			<TestLocationDisplay />
			<Routes>
				<Route
					path="/"
					element={
						<TestMainNav
							isLoggedIn={true}
							isMenuOpen={true}
						/>
					}
				/>
				<Route
					path={routePath}
					element={<PageComponent />}
				/>
			</Routes>
		</>,
		store,
	)

	if (viewportType === viewports.mobile) {
		cy.setViewportToMobile()
	} else if (viewportType === viewports.tablet) {
		cy.setViewportToTablet()
	} else {
		cy.setViewportToDesktop()
	}

	cy.get(navMenuItem).click()
	cy.get(testSelectors.locationDisplay).should('have.text', routePath)
	cy.get(locationPageClassName).should('exist')
}
