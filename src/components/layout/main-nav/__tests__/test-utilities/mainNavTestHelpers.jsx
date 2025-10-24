import { TOP_NAVIGATION_SELECTORS } from '../../../../../../cypress/support/constants/selectors/components'
import { TEST_SELECTORS } from '../../../../../../cypress/support/constants/selectors/test-utilities'
import { APP_URLS } from '../../../../../../cypress/support/constants/api/urls'
import { viewports } from '../../../../../../cypress/support/constants/viewports'

// TODO: Remove and import hooks once store slices are implemented
export const mockUseMainNavState = () => ({
	travellerName: 'Test User',
	// TODO: Add messages count when messages store is implemented
	// totalMessages: 5,
	useLogout: () => {},
})

export const assertMenuItems = (travellerName = 'Test User') => {
	cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES)
		.should('exist')
		.and('be.visible')
		.should('have.attr', 'href', APP_URLS.CY_MESSAGES)
		.and('have.text', 'Messages')
	cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_TRAVELLERS)
		.should('exist')
		.and('be.visible')
		.should('have.attr', 'href', APP_URLS.CY_TRAVELLERS)
		.and('have.text', 'Travellers')
	cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_LOGOUT)
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
	cy.get(TEST_SELECTORS.LOCATION_DISPLAY).should('have.text', routePath)
	cy.get(locationPageClassName).should('exist')
}
