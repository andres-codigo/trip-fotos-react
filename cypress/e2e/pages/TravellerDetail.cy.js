import {
	COMMON_SELECTORS,
	CONTACT_TRAVELLER_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

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
			.find(TRAVELLER_ITEM_SELECTORS.DETAILS)
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

	it('steps through the photo gallery and closes it', () => {
		performLogin(
			TEST_USERS.STANDARD.EMAIL,
			TEST_USERS.STANDARD.PASSWORD,
			detailPath(TEST_USERS.TRAVELLER.ID),
		)

		cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST)
			.find(COMMON_SELECTORS.BASE_IMAGE_BUTTON)
			.first()
			.click()
		cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).should('be.visible')
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain.text',
			'1 of',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_PREVIOUS).should('be.disabled')

		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_NEXT).click()
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain.text',
			'2 of',
		)
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_PREVIOUS).should('be.enabled')

		cy.get('body').type('{esc}')
		cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).should('not.exist')
	})

	it('leads a traveller to the contact form for another traveller', () => {
		performLogin(
			TEST_USERS.TRAVELLER.EMAIL,
			TEST_USERS.TRAVELLER.PASSWORD,
			detailPath(TEST_USERS.OTHER_TRAVELLER.ID),
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(
			'contain.text',
			OTHER.firstName,
		)

		cy.get(TRAVELLER_DETAIL_SELECTORS.CONTACT).click()

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			`${detailPath(TEST_USERS.OTHER_TRAVELLER.ID)}/contact`,
		)
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
	})
})
