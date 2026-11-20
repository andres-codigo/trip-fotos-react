import {
	REPLY_BOX_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'
import { conversationId } from '../../../src/utils/conversationId'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const { SAMPLE_TRAVELLER_ONE: PHOTOGRAPHER, SAMPLE_TRAVELLER_TWO: OTHER } =
	MOCK_TRAVELLERS

const detailPath = (id) => `${PATHS.TRAVELLERS}/${id}`

describe('Traveller Detail page', () => {
	beforeEach(() => {
		cy.resetEmulators()
	})

	it('opens from the travellers list', () => {
		performLogin()

		cy.contains(
			TRAVELLER_ITEM_SELECTORS.ROOT,
			`${PHOTOGRAPHER.firstName} ${PHOTOGRAPHER.lastName}`,
		)
			.find(TRAVELLER_ITEM_SELECTORS.VIEW_TRIP)
			.click()

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			detailPath(TEST_USERS.TRAVELLER.ID),
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(
			'contain.text',
			`${PHOTOGRAPHER.firstName} ${PHOTOGRAPHER.lastName}`,
		)
	})

	it('has no axe violations', () => {
		performLogin(
			TEST_USERS.STANDARD.EMAIL,
			TEST_USERS.STANDARD.PASSWORD,
			detailPath(TEST_USERS.TRAVELLER.ID),
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should('be.visible')

		cy.checkA11y()
	})

	it('opens the conversation with another traveller from Message', () => {
		performLogin(
			TEST_USERS.TRAVELLER.EMAIL,
			TEST_USERS.TRAVELLER.PASSWORD,
			detailPath(TEST_USERS.OTHER_TRAVELLER.ID),
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(
			'contain.text',
			OTHER.firstName,
		)

		cy.get(TRAVELLER_DETAIL_SELECTORS.MESSAGE).click()

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			`${PATHS.MESSAGES}/${conversationId(
				TEST_USERS.TRAVELLER.ID,
				TEST_USERS.OTHER_TRAVELLER.ID,
			)}`,
		)
		cy.get(REPLY_BOX_SELECTORS.INPUT).should('be.visible')
	})
})
