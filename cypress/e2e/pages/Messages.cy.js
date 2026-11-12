import { API_DATABASE } from '../../../src/constants/api'
import {
	CONTACT_TRAVELLER_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	TOAST_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { MOCK_INBOX } from '../../../src/constants/test/mock-data/mock-messages'
import {
	CONTACT_TRAVELLER_CONFIG,
	MESSAGES_CONFIG,
} from '../../../src/constants/travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'
import { atPath } from '../../support/utils/waitForSuccess'

const REQUEST_TIMEOUT = 10000
const MESSAGES_URL = '**/messages/*.json*'
const MESSAGE_URL = '**/messages/*/*.json*'
const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const visitMessages = () => {
	cy.intercept(API_DATABASE.GET, MESSAGES_URL).as('loadMessages')
	cy.visit(PATHS.MESSAGES)
	cy.wait('@loadMessages', { timeout: REQUEST_TIMEOUT })
	cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
}

const deleteFirst = () => {
	cy.get(MESSAGE_ITEM_SELECTORS.DELETE).first().click()
	cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 1)
	cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST).should('be.visible')
}

// Signs in as the seeded traveller: one unread message from the other traveller, and one older email-only message
describe('Logged in > Messages page', () => {
	beforeEach(() => {
		cy.resetEmulators()
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
	})

	it('lists messages newest first, with the sender, time and the right Reply', () => {
		visitMessages()

		cy.get(PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER).should('be.visible')
		cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
			'have.text',
			MESSAGES_CONFIG.SUMMARY(1, 2),
		)
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT)
			.first()
			.within(() => {
				cy.get(MESSAGE_ITEM_SELECTORS.SENDER_LINK)
					.should('have.text', SAMPLE_MESSAGE_ONE.senderName)
					.and(
						'have.attr',
						'href',
						`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}`,
					)
				cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('be.visible')
				cy.get(MESSAGE_ITEM_SELECTORS.TIME)
					.invoke('text')
					.should('match', /^\d+ min ago$/)
				cy.get(MESSAGE_ITEM_SELECTORS.REPLY).should(
					'have.text',
					MESSAGES_CONFIG.REPLY,
				)
			})
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT)
			.last()
			.within(() => {
				cy.get(MESSAGE_ITEM_SELECTORS.SENDER).should(
					'have.text',
					SAMPLE_MESSAGE_TWO.userEmail,
				)
				cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('not.exist')
				cy.get(MESSAGE_ITEM_SELECTORS.TIME).should('not.exist')
				cy.get(MESSAGE_ITEM_SELECTORS.REPLY)
					.should('have.text', MESSAGES_CONFIG.REPLY_BY_EMAIL)
					.and('have.attr', 'href')
					.and('match', /^mailto:sender-two@example\.com\?/)
			})
	})

	it('counts unread messages in the nav until Messages is opened, then marks them read', () => {
		cy.intercept(API_DATABASE.PATCH, MESSAGES_URL).as('markRead')
		cy.visit(PATHS.TRAVELLERS)
		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES, {
			timeout: REQUEST_TIMEOUT,
		}).should('have.text', '1')
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES).should(
			'have.attr',
			'aria-label',
			MESSAGES_CONFIG.NAV_LABEL(1),
		)

		visitMessages()
		cy.wait('@markRead', { timeout: REQUEST_TIMEOUT })
			.its('response.statusCode')
			.should('eq', 200)
		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
		// The marker stays for this visit
		cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('have.length', 1)

		cy.reload()
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
		cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('not.exist')
		cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
			'have.text',
			MESSAGES_CONFIG.SUMMARY(0, 2),
		)
	})

	it('has no axe violations', () => {
		visitMessages()

		cy.checkA11y()
	})

	it('has no axe violations with the Undo toast open', () => {
		visitMessages()
		deleteFirst()

		cy.checkA11y()
	})

	it('deletes the message for good once the toast closes', () => {
		cy.intercept(API_DATABASE.DELETE, MESSAGE_URL).as('deleteMessage')
		visitMessages()
		deleteFirst()

		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
			.find(TOAST_SELECTORS.DISMISS)
			.click()
		cy.wait('@deleteMessage')
			.its('request.url')
			.should('include', `/${SAMPLE_MESSAGE_ONE.id}.json`)

		cy.reload()
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 1)
		cy.contains(SAMPLE_MESSAGE_ONE.message).should('not.exist')
	})

	it('replies in Trip Fotos and comes back to Messages', () => {
		cy.intercept(API_DATABASE.POST, MESSAGES_URL).as('sendReply')
		visitMessages()

		cy.get(MESSAGE_ITEM_SELECTORS.REPLY).first().click()
		cy.location('pathname').should(
			'eq',
			`${PATHS.TRAVELLERS}/${TEST_USERS.OTHER_TRAVELLER.ID}/contact`,
		)
		cy.get(CONTACT_TRAVELLER_SELECTORS.TITLE).should(
			'have.text',
			CONTACT_TRAVELLER_CONFIG.REPLY_TITLE(SAMPLE_MESSAGE_ONE.senderName),
		)
		cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE).should(
			'contain.text',
			SAMPLE_MESSAGE_ONE.message,
		)

		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type(
			'Sunset at Senhora do Monte.',
		)
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
		cy.wait('@sendReply', { timeout: REQUEST_TIMEOUT }).then(
			({ request, response }) => {
				expect(request.url).to.include(
					`/messages/${TEST_USERS.OTHER_TRAVELLER.ID}.json`,
				)
				expect(response.statusCode).to.eq(200)
			},
		)

		cy.waitForSuccess(atPath(PATHS.MESSAGES))
		cy.contains(CONTACT_TRAVELLER_CONFIG.REPLY_SUCCESS_MESSAGE).should(
			'be.visible',
		)
	})
})
