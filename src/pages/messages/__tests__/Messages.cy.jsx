import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import {
	CONVERSATION_ROW_SELECTORS,
	MESSAGE_BUBBLE_SELECTORS,
	MESSAGES_PAGE_SELECTORS,
	REPLY_BOX_SELECTORS,
	THREAD_HEADER_SELECTORS,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import Messages from '@/pages/messages/Messages'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

const CID = 'me_other'
const NOW = Date.now()

const LIST = {
	[CID]: {
		otherId: 'other',
		lastId: 'm2',
		lastMessage: 'Fancy meeting for sunset?',
		lastSenderId: 'other',
		lastAt: NOW - 1000,
		readAt: NOW - 1000,
	},
}
const THREAD = {
	m1: {
		senderId: 'me',
		message: 'Walk up and take the tram down. Early morning is quiet.',
		createdAt: NOW - 60000,
	},
	m2: {
		senderId: 'other',
		message: 'Fancy meeting for sunset?',
		createdAt: NOW - 1000,
	},
}

describe('<Messages />', () => {
	const mountPage = (path) => {
		cy.intercept('GET', '**/userConversations/me.json*', { body: LIST }).as(
			'loadConversations',
		)
		cy.intercept('GET', '**/legacyMessages/me.json*', { body: null })
		cy.intercept('GET', `**/conversations/${CID}/messages.json*`, {
			body: THREAD,
		}).as('loadThread')
		cy.intercept('GET', '**/travellers/other.json*', {
			body: { firstName: 'Tomás', lastName: 'Silva' },
		})
		cy.intercept('PATCH', '**', { body: {} })

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
				<MemoryRouter initialEntries={[path]}>
					<Routes>
						<Route
							path={`${PATHS.MESSAGES}/:conversationId?`}
							element={<Messages />}
						/>
					</Routes>
				</MemoryRouter>
			</Provider>,
		)
		cy.wait('@loadConversations')
	}

	describe('on a phone', () => {
		beforeEach(() => {
			cy.viewport(390, 844)
		})

		it('shows the list alone, one row per conversation', () => {
			mountPage(PATHS.MESSAGES)
			cy.get(CONVERSATION_ROW_SELECTORS.ROOT).should('have.length', 1)
			cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).should('not.exist')
		})

		it('docks the reply box to the bottom edge, full width, below the thread', () => {
			mountPage(`${PATHS.MESSAGES}/${CID}`)
			cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', 2)
			cy.get(MESSAGES_PAGE_SELECTORS.LIST_CARD).should('not.be.visible')

			cy.get(REPLY_BOX_SELECTORS.ROOT).should(($box) => {
				const box = $box[0].getBoundingClientRect()
				expect(box.bottom).to.be.closeTo(844, 1)
				expect(box.left).to.be.closeTo(0, 1)
				expect(box.width).to.be.closeTo(390, 1)
			})
			cy.get(THREAD_HEADER_SELECTORS.BACK).should('be.visible')
			cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT)
				.last()
				.then(($bubble) => {
					cy.get(REPLY_BOX_SELECTORS.ROOT).should(($box) => {
						expect(
							$bubble[0].getBoundingClientRect().bottom,
						).to.be.at.most($box[0].getBoundingClientRect().top)
					})
				})
		})

		it('puts your bubbles on the right and theirs on the left, at most 80% wide', () => {
			mountPage(`${PATHS.MESSAGES}/${CID}`)
			cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).then(($card) => {
				const card = $card[0].getBoundingClientRect()
				cy.get(MESSAGE_BUBBLE_SELECTORS.TEXT).should(($bubbles) => {
					const [mine, theirs] = [...$bubbles].map((bubble) =>
						bubble.getBoundingClientRect(),
					)
					expect(card.right - mine.right).to.be.lessThan(20)
					expect(theirs.left - card.left).to.be.lessThan(20)
					expect(mine.width).to.be.at.most(card.width * 0.8)
				})
			})
		})
	})

	describe('on a tablet', () => {
		it('keeps the thread, header and reply box to the list’s 640px column, centred', () => {
			cy.viewport(1023, 900)
			mountPage(`${PATHS.MESSAGES}/${CID}`)
			cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', 2)

			;[
				MESSAGES_PAGE_SELECTORS.THREAD_COLUMN,
				THREAD_HEADER_SELECTORS.ROOT,
				REPLY_BOX_SELECTORS.ROOT,
			].forEach((selector) =>
				cy.get(selector).should(($element) => {
					const box = $element[0].getBoundingClientRect()
					expect(box.width).to.be.closeTo(640, 1)
					expect(box.left).to.be.closeTo((1023 - 640) / 2, 1)
				}),
			)
			cy.get(REPLY_BOX_SELECTORS.ROOT).should(($box) => {
				expect($box[0].getBoundingClientRect().bottom).to.be.closeTo(
					900,
					1,
				)
			})
		})
	})

	describe('from 1024px', () => {
		beforeEach(() => {
			cy.viewport(1280, 900)
		})

		it('shows the list beside the open thread, with no back arrow', () => {
			mountPage(PATHS.MESSAGES)
			cy.get(MESSAGES_PAGE_SELECTORS.LIST_CARD).should('be.visible')
			cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).should('be.visible')
			cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', 2)
			cy.get(THREAD_HEADER_SELECTORS.BACK).should('not.be.visible')
			cy.get(MESSAGES_PAGE_SELECTORS.LIST_CARD).then(($list) => {
				cy.get(MESSAGES_PAGE_SELECTORS.THREAD_CARD).should(
					($thread) => {
						expect(
							$thread[0].getBoundingClientRect().left,
						).to.be.greaterThan(
							$list[0].getBoundingClientRect().right,
						)
					},
				)
			})
		})

		it('has no axe violations with a thread open', () => {
			mountPage(PATHS.MESSAGES)
			cy.get(MESSAGE_BUBBLE_SELECTORS.ROOT).should('have.length', 2)
			cy.get(MESSAGES_PAGE_SELECTORS.SUMMARY).should(
				'have.text',
				MESSAGES_CONFIG.SUMMARY(0, 1),
			)
			cy.checkA11y()
		})
	})
})
