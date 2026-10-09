import { FOOTER_SELECTORS, TEST_UTILITIES } from '@/constants/test'
import { PATHS } from '@/constants/ui'

import TestLocationDisplay from '@/testUtils/cypress/TestLocationDisplay'

import Footer from '@/components/layout/footer/Footer'

const assertFooter = () => {
	cy.get(FOOTER_SELECTORS.SITE_FOOTER).should('be.visible')
	cy.get(FOOTER_SELECTORS.PRIVACY_LINK)
		.should('be.visible')
		.and('have.attr', 'href', PATHS.PRIVACY)
		.and('contain.text', 'Privacy policy')
}

describe('<Footer />', () => {
	beforeEach(() => {
		cy.createMockStore(null).then((store) => {
			cy.mountWithProviders(
				<>
					<Footer />
					<TestLocationDisplay />
				</>,
				store,
			)
		})
	})

	describe('Rendering tests', () => {
		it('renders the privacy policy link on mobile, tablet and desktop', () => {
			cy.setViewportToMobile()
			assertFooter()

			cy.setViewportToTablet()
			assertFooter()

			cy.setViewportToDesktop()
			assertFooter()
		})
	})

	describe('Behaviour tests', () => {
		it('navigates to the privacy page when the link is clicked', () => {
			cy.get(FOOTER_SELECTORS.PRIVACY_LINK).click()
			cy.get(TEST_UTILITIES.ROUTE_PATH).should('have.text', PATHS.PRIVACY)
		})
	})
})
