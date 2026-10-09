import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { FOOTER_SELECTORS } from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

describe('Not logged in > Privacy page', () => {
	it('is reachable from the footer without signing in', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)

		cy.get(FOOTER_SELECTORS.PRIVACY_LINK).click()

		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PRIVACY)
		cy.get(PAGE_SELECTORS.PRIVACY_MAIN_CONTAINER).should('be.visible')
		cy.contains('h1', 'Privacy policy').should('be.visible')
	})

	it('loads directly without redirecting to authentication', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.PRIVACY)

		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PRIVACY)
		cy.get(PAGE_SELECTORS.PRIVACY_MAIN_CONTAINER).should('be.visible')
	})
})
