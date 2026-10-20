import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import { MESSAGE_ITEM_SELECTORS, MOCK_INBOX } from '@/constants/test'

import MessageItem from '@/components/messages/message-item/MessageItem'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

const { SAMPLE_MESSAGE_ONE } = MOCK_INBOX

describe('<MessageItem />', () => {
	const mountItem = () => {
		const store = configureStore({
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
				<ul>
					<MessageItem
						id={SAMPLE_MESSAGE_ONE.id}
						email={SAMPLE_MESSAGE_ONE.userEmail}
						message={SAMPLE_MESSAGE_ONE.message}
					/>
				</ul>
			</Provider>,
		)
	}

	it('renders the sender email link and message', () => {
		mountItem()

		cy.get(MESSAGE_ITEM_SELECTORS.EMAIL)
			.should('contain', SAMPLE_MESSAGE_ONE.userEmail)
			.and('have.attr', 'href', `mailto:${SAMPLE_MESSAGE_ONE.userEmail}`)
		cy.get(MESSAGE_ITEM_SELECTORS.TEXT).should(
			'contain',
			SAMPLE_MESSAGE_ONE.message,
		)
		cy.get(MESSAGE_ITEM_SELECTORS.DELETE).should('be.visible')
	})

	it('shows an error dialog when the delete request fails', () => {
		cy.intercept('DELETE', '**/messages/me/*.json*', {
			statusCode: 500,
			body: {},
		}).as('deleteMessage')
		mountItem()

		cy.get(MESSAGE_ITEM_SELECTORS.DELETE).click()
		cy.wait('@deleteMessage')

		cy.get(MESSAGE_ITEM_SELECTORS.ERROR_DIALOG).should('be.visible')
		cy.get(MESSAGE_ITEM_SELECTORS.ROOT).should('exist')
	})
})
