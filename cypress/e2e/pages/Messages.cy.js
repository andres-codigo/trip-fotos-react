import { API_DATABASE } from '../../../src/constants/api'
import {
	MESSAGE_ITEM_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { MOCK_INBOX } from '../../../src/constants/test/mock-data/mock-messages'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const MESSAGES_URL = '**/messages/*.json*'
const MESSAGE_URL = '**/messages/*/*.json*'
const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const inbox = {
	[SAMPLE_MESSAGE_ONE.id]: {
		userEmail: SAMPLE_MESSAGE_ONE.userEmail,
		message: SAMPLE_MESSAGE_ONE.message,
	},
	[SAMPLE_MESSAGE_TWO.id]: {
		userEmail: SAMPLE_MESSAGE_TWO.userEmail,
		message: SAMPLE_MESSAGE_TWO.message,
	},
}

const isEmulated = Cypress.expose('USE_EMULATORS') === 'true'

// The live inbox is stubbed so the test user's real messages are never read or deleted;
// the emulator run signs in as the seeded traveller and uses its real inbox
describe('Logged in > Messages page', () => {
	beforeEach(() => {
		cy.resetEmulators()
		if (isEmulated) {
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)
		} else {
			performLogin()
		}
	})

	it('lists received messages', () => {
		cy.stubLiveOnly(API_DATABASE.GET, MESSAGES_URL, inbox).as(
			'loadMessages',
		)
		cy.visit(PATHS.MESSAGES)
		cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })

		cy.get(PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER).should('be.visible')
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
		cy.contains(SAMPLE_MESSAGE_ONE.message).should('be.visible')
		cy.contains(SAMPLE_MESSAGE_TWO.userEmail).should('be.visible')
	})

	it('has no axe violations', () => {
		cy.stubLiveOnly(API_DATABASE.GET, MESSAGES_URL, inbox).as(
			'loadMessages',
		)
		cy.visit(PATHS.MESSAGES)
		cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)

		cy.checkA11y()
	})

	it('shows the empty state when there are no messages', () => {
		cy.intercept(API_DATABASE.GET, MESSAGES_URL, 'null').as('loadMessages')
		cy.visit(PATHS.MESSAGES)
		cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })

		cy.get(MESSAGES_PAGE_SELECTORS.EMPTY).should('be.visible')
	})

	it('removes a message when it is deleted', () => {
		cy.stubLiveOnly(API_DATABASE.GET, MESSAGES_URL, inbox).as(
			'loadMessages',
		)
		cy.stubLiveOnly(API_DATABASE.DELETE, MESSAGE_URL, 'null').as(
			'deleteMessage',
		)
		cy.visit(PATHS.MESSAGES)
		cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })

		cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
		cy.wait('@deleteMessage')
			.its('request.url')
			.should('include', `/${SAMPLE_MESSAGE_ONE.id}.json`)

		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 1)
		cy.contains(SAMPLE_MESSAGE_ONE.message).should('not.exist')

		if (isEmulated) {
			cy.reload()
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 1)
			cy.contains(SAMPLE_MESSAGE_TWO.message).should('be.visible')
			cy.contains(SAMPLE_MESSAGE_ONE.message).should('not.exist')
		}
	})

	it('shows an error dialog when loading fails', () => {
		cy.intercept(API_DATABASE.GET, MESSAGES_URL, {
			statusCode: 500,
			body: {},
		}).as('loadMessages')
		cy.visit(PATHS.MESSAGES)
		cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })

		cy.get(MESSAGES_PAGE_SELECTORS.ERROR_DIALOG).should('be.visible')
	})
})
