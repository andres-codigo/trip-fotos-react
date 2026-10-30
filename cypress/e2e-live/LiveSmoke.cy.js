import { PAGE_SELECTORS } from '../../src/constants/test/selectors/pages'
import { DIALOG_SELECTORS } from '../../src/constants/test/selectors/components'
import { PATHS } from '../../src/constants/ui/paths'

import { performLogin } from '../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000

// Read-only: catches drift the emulators cannot (keys, console settings, deployed rules, real token signing)
describe('Live smoke', () => {
	it('signs in and reads the travellers list', () => {
		cy.intercept('GET', '**/travellers.json*').as('getTravellers')

		performLogin()
		cy.visit(PATHS.TRAVELLERS)

		cy.wait('@getTravellers', { timeout: REQUEST_TIMEOUT })
			.its('response.statusCode')
			.should('eq', 200)
		cy.get(PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER).should('exist')
		cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('not.exist')
	})
})
