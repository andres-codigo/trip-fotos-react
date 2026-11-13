import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import {
	MESSAGE_ACTIONS_SELECTORS,
	MESSAGE_ITEM_SELECTORS,
	MESSAGE_PANE_SELECTORS,
	MESSAGE_ROW_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	MOCK_INBOX,
	TOAST_SELECTORS,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import Messages from '@/pages/messages/Messages'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const INBOX = {
	[SAMPLE_MESSAGE_ONE.id]: {
		senderId: SAMPLE_MESSAGE_ONE.senderId,
		message: SAMPLE_MESSAGE_ONE.message,
		createdAt: SAMPLE_MESSAGE_ONE.createdAt,
		read: false,
	},
	[SAMPLE_MESSAGE_TWO.id]: {
		userEmail: SAMPLE_MESSAGE_TWO.userEmail,
		message: SAMPLE_MESSAGE_TWO.message,
	},
}

describe('<Messages />', () => {
	const mountPage = ({ inbox = INBOX, deleteStatus = 200 } = {}) => {
		cy.intercept('GET', '**/messages/me.json*', { body: inbox }).as(
			'loadMessages',
		)
		cy.intercept(
			'GET',
			`**/travellers/${SAMPLE_MESSAGE_ONE.senderId}.json*`,
			{
				body: { firstName: 'Jane', lastName: 'Smith' },
			},
		)
		cy.intercept('PATCH', '**/messages/me.json*', { body: {} }).as(
			'markRead',
		)
		cy.intercept('DELETE', '**/messages/me/*.json*', {
			statusCode: deleteStatus,
			body: deleteStatus === 200 ? null : {},
		}).as('deleteMessage')

		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				messages: messagesReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
					token: 'token',
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter initialEntries={[PATHS.MESSAGES]}>
					<Messages />
				</MemoryRouter>
			</Provider>,
		)
		cy.wait('@loadMessages')
	}

	const deleteOf = (message) =>
		cy
			.contains(MESSAGE_ITEM_SELECTORS.ROOT, message.message)
			.find(MESSAGE_ACTIONS_SELECTORS.DELETE)

	const replyOf = (message) =>
		cy
			.contains(MESSAGE_ITEM_SELECTORS.ROOT, message.message)
			.find(MESSAGE_ACTIONS_SELECTORS.REPLY)

	it('lists the messages, marks the unread one read and passes a11y', () => {
		mountPage()

		cy.wait('@markRead')
			.its('request.body')
			.should('deep.equal', { [`${SAMPLE_MESSAGE_ONE.id}/read`]: true })
		cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
			'have.text',
			MESSAGES_CONFIG.SUMMARY(1, 2),
		)
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
		cy.get(MESSAGE_ITEM_SELECTORS.NEW_TAG).should('have.length', 1)
		cy.checkA11y()
	})

	it('shows the empty state and passes a11y', () => {
		mountPage({ inbox: null })

		cy.get(MESSAGES_PAGE_SELECTORS.EMPTY).should('be.visible')
		cy.get(MESSAGES_PAGE_SELECTORS.BROWSE_TRAVELLERS).should(
			'have.attr',
			'href',
			PATHS.TRAVELLERS,
		)
		cy.checkA11y()
	})

	it('Undo restores the card, focuses its Reply and sends no delete', () => {
		mountPage()
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)

		deleteOf(SAMPLE_MESSAGE_ONE).click()

		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 1)
		replyOf(SAMPLE_MESSAGE_TWO).should('have.focus')
		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST)
			.should('be.visible')
			.and('contain', MESSAGES_CONFIG.DELETED)
		cy.checkA11y()

		cy.get(TOAST_SELECTORS.ACTION).click()

		cy.get(MESSAGES_PAGE_SELECTORS.UNDO_TOAST).should('not.exist')
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
		replyOf(SAMPLE_MESSAGE_ONE).should('have.focus')
		cy.get('@deleteMessage.all').should('have.length', 0)
	})

	it('shows the inline alert when the delete fails, and passes a11y', () => {
		mountPage({ deleteStatus: 500 })
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)

		deleteOf(SAMPLE_MESSAGE_ONE).click()
		cy.get(TOAST_SELECTORS.DISMISS).click()

		cy.wait('@deleteMessage')
		cy.get(MESSAGE_ACTIONS_SELECTORS.DELETE_ERROR).should('be.visible')
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
		cy.checkA11y()

		cy.get(MESSAGE_ACTIONS_SELECTORS.TRY_AGAIN).click()
		cy.wait('@deleteMessage')
		cy.get(MESSAGE_ACTIONS_SELECTORS.DELETE_ERROR).should('be.visible')
	})

	describe('Inbox either side of 1024px', () => {
		const box = (selector) =>
			cy.get(selector).then(($el) => $el[0].getBoundingClientRect())

		it('stays the list of cards at 1023px', () => {
			cy.viewport(1023, 900)
			mountPage()

			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('have.length', 2)
			cy.get(MESSAGES_PAGE_SELECTORS.INBOX).should('not.exist')
		})

		it('puts a 380px list beside the reading pane from 1024px, and passes a11y', () => {
			cy.viewport(1024, 900)
			mountPage()

			cy.get(MESSAGE_ROW_SELECTORS.ROOT).should('have.length', 2)
			cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('not.exist')
			box(MESSAGES_PAGE_SELECTORS.INBOX_LIST).then((list) => {
				expect(list.width).to.be.closeTo(380, 0.5)
				box(MESSAGE_PANE_SELECTORS.ROOT).then((pane) => {
					expect(pane.left - list.right).to.be.closeTo(24, 0.5)
					expect(pane.top).to.be.closeTo(list.top, 0.5)
					expect(pane.width).to.be.greaterThan(450)
				})
			})
			cy.get(MESSAGE_PANE_SELECTORS.SENDER).should(
				'contain',
				'Jane Smith',
			)
			cy.checkA11y()
		})

		it('caps the inbox at 1160px at 1280px', () => {
			cy.viewport(1280, 900)
			mountPage()

			box(MESSAGES_PAGE_SELECTORS.INBOX).then((inbox) => {
				expect(inbox.width).to.be.closeTo(1160, 0.5)
			})
		})
	})
})
