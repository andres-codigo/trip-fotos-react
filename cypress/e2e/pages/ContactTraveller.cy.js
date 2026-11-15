import { TRAVELLER_DETAIL_SELECTORS } from '../../../src/constants/test/selectors/components'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'
import { conversationId } from '../../../src/utils/conversationId'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000

const contactPath = (id) => `${PATHS.TRAVELLERS}/${id}/contact`

// The Contact page went when Message started opening the thread; its address still works
describe('Contact traveller address', () => {
	beforeEach(() => {
		cy.resetEmulators()
	})

	it('opens the conversation with that traveller', () => {
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
		cy.visit(contactPath(TEST_USERS.OTHER_TRAVELLER.ID))

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			`${PATHS.MESSAGES}/${conversationId(
				TEST_USERS.TRAVELLER.ID,
				TEST_USERS.OTHER_TRAVELLER.ID,
			)}`,
		)
	})

	it('sends a traveller writing to themselves to their own trip', () => {
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
		cy.visit(contactPath(TEST_USERS.TRAVELLER.ID))

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			`${PATHS.TRAVELLERS}/${TEST_USERS.TRAVELLER.ID}`,
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.ROOT).should('exist')
	})

	it('asks a signed-out visitor to log in first', () => {
		cy.visit(contactPath(TEST_USERS.OTHER_TRAVELLER.ID))

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			PATHS.AUTHENTICATION,
		)
		cy.location('search').should(
			'eq',
			`?redirect=${encodeURIComponent(contactPath(TEST_USERS.OTHER_TRAVELLER.ID))}`,
		)
	})
})
