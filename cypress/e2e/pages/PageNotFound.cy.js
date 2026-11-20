import { PAGE_NOT_FOUND_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { performLogin } from '../../support/utils/authHelpers'

const visitMissingPage = () => {
	cy.visit(PATHS.NON_EXISTENT_PATH, { failOnStatusCode: false })
	cy.url().should('eq', BASE_URL_CYPRESS + PATHS.PAGE_NOT_FOUND)
}

describe('Logged in > PageNotFound page', () => {
	it('sends its action to Travellers', () => {
		performLogin()
		visitMissingPage()

		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION).click()
		cy.location('pathname').should('eq', PATHS.TRAVELLERS)
	})
})

describe('Not logged in > PageNotFound page', () => {
	it('sends its action to Log in', () => {
		visitMissingPage()

		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION).click()
		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
	})

	it('has no axe violations', () => {
		visitMissingPage()
		cy.get(PAGE_NOT_FOUND_SELECTORS.ACTION).should('be.visible')

		cy.checkA11y()
	})
})
