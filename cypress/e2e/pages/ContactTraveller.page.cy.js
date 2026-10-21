import {
	CONTACT_TRAVELLER_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const OTHER_TRAVELLER_ID = 'e2e-other-traveller'

const contactPath = (id) => `${PATHS.TRAVELLERS}/${id}/contact`

// The E2E user is not a registered traveller, so seed the persisted flag a registered user would carry
const visitAsTraveller = (path) =>
	cy.visit(path, {
		onBeforeLoad(win) {
			const persisted = JSON.parse(
				win.localStorage.getItem('persist:root'),
			)
			const travellers = JSON.parse(persisted.travellers)
			persisted.travellers = JSON.stringify({
				...travellers,
				isTraveller: true,
			})
			win.localStorage.setItem('persist:root', JSON.stringify(persisted))
		},
	})

const assertRedirectedToDetail = (id) => {
	cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
		'eq',
		`${PATHS.TRAVELLERS}/${id}`,
	)
	cy.get(TRAVELLER_DETAIL_SELECTORS.ROOT).should('exist')
	cy.get(CONTACT_TRAVELLER_SELECTORS.ROOT).should('not.exist')
}

describe('Contact Traveller Page', () => {
	beforeEach(() => {
		performLogin()
	})

	it('shows the contact form to a traveller after a hard reload', () => {
		visitAsTraveller(contactPath(OTHER_TRAVELLER_ID))

		cy.location('pathname').should('eq', contactPath(OTHER_TRAVELLER_ID))
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
	})

	it('redirects a traveller away from contacting their own record', () => {
		cy.window()
			.then((win) => win.localStorage.getItem('userId'))
			.then((userId) => {
				visitAsTraveller(contactPath(userId))
				assertRedirectedToDetail(userId)
			})
	})

	it('redirects a non-traveller to the traveller detail page', () => {
		cy.visit(contactPath(OTHER_TRAVELLER_ID))
		assertRedirectedToDetail(OTHER_TRAVELLER_ID)
	})
})
