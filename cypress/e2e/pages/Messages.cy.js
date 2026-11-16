import { API_DATABASE } from '../../../src/constants/api'
import {
	CONVERSATION_ROW_SELECTORS,
	MESSAGE_BUBBLE_SELECTORS,
	MESSAGE_THREAD_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	REPLY_BOX_SELECTORS,
	THREAD_HEADER_SELECTORS,
	THREAD_NOTE_SELECTORS,
	TOAST_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { MOCK_THREADS } from '../../../src/constants/test/mock-data/mock-messages'
import { MESSAGES_CONFIG } from '../../../src/constants/travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'
import { conversationId } from '../../../src/utils/conversationId'

import { performLogin, sdkSessionOf } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const LIST_URL = '**/userConversations/*.json*'
const ENTRY_URL = '**/userConversations/*/*.json*'
const ROOT_URL = '**/.json*'

const ME = () => TEST_USERS.TRAVELLER.ID
const OTHER = () => TEST_USERS.OTHER_TRAVELLER.ID
const CID = () => conversationId(ME(), OTHER())
const ME_NAME = 'John Doe'
const OTHER_NAME = 'Jane Smith'
const REPLY = 'Walk up and take the tram down.'
const ANSWER = 'Will do, thanks!'

const visitMessages = (path = PATHS.MESSAGES) => {
	cy.intercept(API_DATABASE.GET, LIST_URL).as('loadConversations')
	cy.visit(path)
	cy.wait('@loadConversations', { timeout: REQUEST_TIMEOUT })
}

const openOtherThread = (length = MOCK_THREADS.TWO_SIDED.length) => {
	visitMessages()
	cy.contains(CONVERSATION_ROW_SELECTORS.LINK, OTHER_NAME).click()
	cy.location('pathname').should('eq', `${PATHS.MESSAGES}/${CID()}`)
	cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', length)
}

// Signs in as the seeded traveller: an unread two-sided thread with the other traveller, a read one from a former traveller, and one email-only message
describe('Logged in > Messages page', () => {
	beforeEach(() => {
		cy.resetEmulators()
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
	})

	it('lists one row per conversation, newest first, with the unread one marked', () => {
		visitMessages()

		cy.get(PAGE_SELECTORS.MESSAGES_MAIN_CONTAINER).should('be.visible')
		cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
			'have.text',
			MESSAGES_CONFIG.SUMMARY(1, 3),
		)
		cy.get(CONVERSATION_ROW_SELECTORS.NAME).then(($names) => {
			expect([...$names].map((name) => name.textContent)).to.deep.equal([
				`${OTHER_NAME}${MESSAGES_CONFIG.NEW_ROW_HIDDEN}`,
				MESSAGES_CONFIG.FORMER_TRAVELLER,
				MOCK_THREADS.LEGACY.userEmail,
			])
		})
		cy.get(CONVERSATION_ROW_SELECTORS.DOT).should('have.length', 1)
	})

	it('shows both sides of a thread and marks it read, keeping "New" for the visit', () => {
		cy.intercept(API_DATABASE.PATCH, ENTRY_URL).as('markRead')
		cy.visit(PATHS.TRAVELLERS)
		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES, {
			timeout: REQUEST_TIMEOUT,
		}).should('have.text', '1')

		openOtherThread()
		cy.wait('@markRead', { timeout: REQUEST_TIMEOUT })
			.its('response.statusCode')
			.should('eq', 200)
		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
		cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER).should('be.visible')
		MOCK_THREADS.TWO_SIDED.forEach(({ message }) =>
			cy.contains(MESSAGE_BUBBLE_SELECTORS.ROOT, message),
		)

		cy.reload()
		cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should(
			'have.length',
			MOCK_THREADS.TWO_SIDED.length,
		)
		cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER).should('not.exist')
	})

	it('lets the two travellers message back and forth, each seeing the whole thread', () => {
		const total = MOCK_THREADS.TWO_SIDED.length
		cy.intercept(API_DATABASE.PATCH, ROOT_URL).as('send')
		openOtherThread()

		cy.get(REPLY_BOX_SELECTORS.INPUT).type(REPLY)
		cy.get(REPLY_BOX_SELECTORS.SEND).click()
		cy.wait('@send', { timeout: REQUEST_TIMEOUT })
			.its('response.statusCode')
			.should('eq', 200)
		cy.get(REPLY_BOX_SELECTORS.INPUT).should('have.value', '')
		cy.contains(MESSAGE_BUBBLE_SELECTORS.ROOT, REPLY)
			.should('be.visible')
			.and('have.attr', 'data-mine')
		cy.visit(PATHS.MESSAGES)
		cy.contains(
			CONVERSATION_ROW_SELECTORS.PREVIEW,
			`${MESSAGES_CONFIG.YOU_PREFIX}${REPLY}`,
		)

		// The other traveller sees the reply unread, from the first, and answers it
		performLogin(
			TEST_USERS.OTHER_TRAVELLER.EMAIL,
			TEST_USERS.OTHER_TRAVELLER.PASSWORD,
			PATHS.TRAVELLERS,
		)
		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES, {
			timeout: REQUEST_TIMEOUT,
		}).should('have.text', '1')
		visitMessages()
		cy.contains(CONVERSATION_ROW_SELECTORS.PREVIEW, REPLY)
		cy.contains(CONVERSATION_ROW_SELECTORS.LINK, ME_NAME).click()
		cy.location('pathname').should('eq', `${PATHS.MESSAGES}/${CID()}`)
		cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', total + 1)
		cy.contains(MESSAGE_BUBBLE_SELECTORS.ROOT, REPLY).should(
			'not.have.attr',
			'data-mine',
		)
		cy.get(MESSAGE_THREAD_SELECTORS.NEW_DIVIDER).should('be.visible')
		cy.get(REPLY_BOX_SELECTORS.INPUT).type(ANSWER)
		cy.get(REPLY_BOX_SELECTORS.SEND).click()
		cy.wait('@send', { timeout: REQUEST_TIMEOUT })
			.its('response.statusCode')
			.should('eq', 200)
		cy.contains(MESSAGE_BUBBLE_SELECTORS.ROOT, ANSWER).should(
			'have.attr',
			'data-mine',
		)

		// Back as the first traveller, the answer closes the thread in order
		performLogin(
			TEST_USERS.TRAVELLER.EMAIL,
			TEST_USERS.TRAVELLER.PASSWORD,
			PATHS.TRAVELLERS,
		)
		openOtherThread(total + 2)
		// Each text starts with a screen-reader prefix (sender and time), so only the endings are compared
		cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT).then(($texts) => {
			const [reply, answer] = [...$texts]
				.slice(-2)
				.map((text) => text.textContent)
			expect(reply.endsWith(REPLY), reply).to.equal(true)
			expect(answer.endsWith(ANSWER), answer).to.equal(true)
		})
		cy.contains(MESSAGE_BUBBLE_SELECTORS.ROOT, ANSWER).should(
			'not.have.attr',
			'data-mine',
		)
	})

	it('keeps a reply that failed to send, with Try again', () => {
		cy.intercept(API_DATABASE.PATCH, ROOT_URL, { forceNetworkError: true })
		openOtherThread()

		cy.get(REPLY_BOX_SELECTORS.INPUT).type(REPLY)
		cy.get(REPLY_BOX_SELECTORS.SEND).click()
		cy.get(MESSAGE_BUBBLE_SELECTORS.FAILED).should('be.visible')
		cy.get(MESSAGE_BUBBLE_SELECTORS.TRY_AGAIN).should('be.visible')
	})

	it('deletes a conversation for good once the toast closes, and Undo brings it back', () => {
		// Opening the thread marks it read with a PATCH to the same entry, so only the delete's own request takes the alias
		cy.intercept(API_DATABASE.PATCH, ENTRY_URL, (req) => {
			if (req.body?.clearedAt) req.alias = 'clear'
		})
		openOtherThread()

		cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
		cy.get(THREAD_HEADER_SELECTORS.DELETE).click()
		cy.location('pathname').should('eq', PATHS.MESSAGES)
		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST).should('be.visible')
		cy.contains(CONVERSATION_ROW_SELECTORS.NAME, OTHER_NAME).should(
			'not.exist',
		)
		cy.checkA11y()

		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
			.contains(MESSAGES_CONFIG.UNDO)
			.click()
		cy.contains(CONVERSATION_ROW_SELECTORS.NAME, OTHER_NAME).click()
		cy.get(THREAD_HEADER_SELECTORS.MENU_BUTTON).click()
		cy.get(THREAD_HEADER_SELECTORS.DELETE).click()
		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
			.find(TOAST_SELECTORS.DISMISS)
			.click()
		cy.wait('@clear')
			.its('request.body')
			.should('have.keys', ['readAt', 'clearedAt'])

		cy.reload()
		cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
			'have.text',
			MESSAGES_CONFIG.SUMMARY(0, 2),
		)
		cy.contains(CONVERSATION_ROW_SELECTORS.NAME, OTHER_NAME).should(
			'not.exist',
		)
	})

	it('shows a former traveller’s thread read-only and an email-only message with Reply by email', () => {
		visitMessages()
		cy.contains(
			CONVERSATION_ROW_SELECTORS.LINK,
			MESSAGES_CONFIG.FORMER_TRAVELLER,
		).click()
		cy.contains(
			MESSAGE_BUBBLE_SELECTORS.ROOT,
			MOCK_THREADS.FORMER[0].message,
		)
		cy.get(THREAD_NOTE_SELECTORS.ROOT).should(
			'contain.text',
			MESSAGES_CONFIG.FORMER_NOTE_TITLE,
		)
		cy.get(REPLY_BOX_SELECTORS.ROOT).should('not.exist')

		cy.get(THREAD_HEADER_SELECTORS.BACK).click()
		cy.contains(
			CONVERSATION_ROW_SELECTORS.LINK,
			MOCK_THREADS.LEGACY.userEmail,
		).click()
		cy.get(THREAD_NOTE_SELECTORS.REPLY_BY_EMAIL)
			.should('have.attr', 'href')
			.and('match', /^mailto:sender-two@example\.com\?/)
		cy.get(REPLY_BOX_SELECTORS.ROOT).should('not.exist')
	})

	it('opens the first conversation beside the list from 1024px', () => {
		cy.viewport(1280, 900)
		visitMessages()

		cy.location('pathname').should('eq', `${PATHS.MESSAGES}/${CID()}`)
		cy.get(MESSAGES_PAGE_SELECTORS.LIST_CARD).should('be.visible')
		cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).should('be.visible')
		cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should(
			'have.length',
			MOCK_THREADS.TWO_SIDED.length,
		)
		cy.checkA11y()
	})

	it('has no axe violations on the list and a thread', () => {
		visitMessages()
		cy.get(CONVERSATION_ROW_SELECTORS.ROOT).should('have.length', 3)
		cy.checkA11y()

		cy.contains(CONVERSATION_ROW_SELECTORS.LINK, OTHER_NAME).click()
		cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('exist')
		cy.checkA11y()
	})
})

// Talks to the emulator directly, as a script could, so a pass proves the rules and not just the UI
describe('Conversation database rules', () => {
	const url = (path) => `${Cypress.expose('VITE_DATABASE_URL')}/${path}.json`
	const write = (method, path, token, body) =>
		cy.request({
			method,
			url: url(path),
			qs: { ns: Cypress.expose('VITE_DATABASE_NAMESPACE'), auth: token },
			body,
			failOnStatusCode: false,
		})
	const read = (path, token) => write(API_DATABASE.GET, path, token)
	const signedInToken = () =>
		cy.window().then((win) => sdkSessionOf(win).token)

	// The message and both summaries in one update, field by field, as the app sends them
	const sendBody = (senderId, otherId, id, message = 'Hello from rules.') => {
		const cid = conversationId(senderId, otherId)
		const summary = {
			lastId: id,
			lastMessage: message,
			lastSenderId: senderId,
			lastAt: API_DATABASE.SERVER_TIMESTAMP,
		}
		const fieldsOf = (uid, fields) =>
			Object.fromEntries(
				Object.entries(fields).map(([key, value]) => [
					`userConversations/${uid}/${cid}/${key}`,
					value,
				]),
			)
		return {
			[`conversations/${cid}/messages/${id}`]: {
				senderId,
				message,
				createdAt: API_DATABASE.SERVER_TIMESTAMP,
			},
			...fieldsOf(senderId, { otherId, ...summary }),
			...fieldsOf(otherId, { otherId: senderId, ...summary }),
		}
	}
	const PUSH_ID = '-ORulesTest000000001'

	beforeEach(() => {
		cy.resetEmulators()
	})

	it('refuses a message from a signed-in user who is not a traveller', () => {
		performLogin()
		cy.window().then((win) =>
			write(
				API_DATABASE.PATCH,
				'',
				sdkSessionOf(win).token,
				sendBody(sdkSessionOf(win).userId, OTHER(), PUSH_ID),
			)
				.its('status')
				.should('be.oneOf', [401, 403]),
		)
	})

	describe('as a traveller', () => {
		beforeEach(() => {
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)
		})

		it('accepts a message written as themselves with both summaries, and lets them read it', () => {
			signedInToken().then((token) => {
				write(
					API_DATABASE.PATCH,
					'',
					token,
					sendBody(ME(), OTHER(), PUSH_ID),
				)
					.its('status')
					.should('eq', 200)
				read(`conversations/${CID()}/messages/${PUSH_ID}`, token)
					.its('body.senderId')
					.should('eq', ME())
			})
		})

		it('refuses a message written as someone else', () => {
			signedInToken().then((token) =>
				write(
					API_DATABASE.PATCH,
					'',
					token,
					sendBody(OTHER(), ME(), PUSH_ID),
				)
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})

		it('refuses a summary written without its message', () => {
			signedInToken().then((token) => {
				const body = sendBody(ME(), OTHER(), PUSH_ID)
				delete body[`conversations/${CID()}/messages/${PUSH_ID}`]
				write(API_DATABASE.PATCH, '', token, body)
					.its('status')
					.should('be.oneOf', [401, 403])
			})
		})

		it('refuses to edit a message once sent', () => {
			signedInToken().then((token) => {
				write(
					API_DATABASE.PATCH,
					'',
					token,
					sendBody(ME(), OTHER(), PUSH_ID),
				)
					.its('status')
					.should('eq', 200)
				// An object, so the body is valid JSON and the request reaches the rules
				write(
					API_DATABASE.PATCH,
					`conversations/${CID()}/messages/${PUSH_ID}`,
					token,
					{ message: 'Changed' },
				)
					.its('status')
					.should('be.oneOf', [401, 403])
			})
		})

		it('refuses to read a conversation they are not in', () => {
			signedInToken().then((token) =>
				read(
					`conversations/${conversationId(OTHER(), 'someone-else')}/messages`,
					token,
				)
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})

		it('refuses a new message in the old inbox', () => {
			signedInToken().then((token) =>
				write(API_DATABASE.POST, `messages/${OTHER()}`, token, {
					senderId: ME(),
					message: 'Hello',
					createdAt: API_DATABASE.SERVER_TIMESTAMP,
					read: false,
				})
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})
	})
})
