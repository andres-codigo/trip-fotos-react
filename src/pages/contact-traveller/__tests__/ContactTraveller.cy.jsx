import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import ContactTraveller from '@/pages/contact-traveller/ContactTraveller'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'
import { getByDataCy } from '@/testUtils/cypress/selectors'
import { CONTACT_TRAVELLER_CONFIG } from '@/constants/travellers'
import { API_DATABASE } from '@/constants/api'
import { PATHS } from '@/constants/ui'

const TRAVELLERS_STUB = 'travellers-stub'
const MESSAGES_STUB = 'messages-stub'

const MessagesStub = () => {
	const location = useLocation()
	return <p data-cy={MESSAGES_STUB}>{location.state?.alertMessage}</p>
}

const REPLY_TO = Object.freeze({
	name: 'Jane Smith',
	message: 'Loved your Lisbon photos.',
	createdAt: null,
})

describe('<ContactTraveller />', () => {
	const mountPage = (state) => {
		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				messages: messagesReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
				},
				travellers: {
					...travellersReducer(undefined, { type: '@@init' }),
					travellers: [{ id: 'abc', firstName: 'Ada' }],
					isTraveller: true,
					isTravellerCheckedFor: 'me',
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter
					initialEntries={[
						{ pathname: '/travellers/abc/contact', state },
					]}>
					<Routes>
						<Route
							path="/travellers/:id/contact"
							element={<ContactTraveller />}
						/>
						<Route
							path="/travellers"
							element={
								<p data-cy={TRAVELLERS_STUB}>Travellers</p>
							}
						/>
						<Route
							path={PATHS.MESSAGES}
							element={<MessagesStub />}
						/>
					</Routes>
				</MemoryRouter>
			</Provider>,
		)
	}

	const sendMessage = () => {
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type('Hello')
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
	}

	it('names the traveller and asks only for a message', () => {
		mountPage()
		cy.get(CONTACT_TRAVELLER_SELECTORS.TITLE).should(
			'have.text',
			CONTACT_TRAVELLER_CONFIG.TITLE('Ada'),
		)
		cy.get('input[type="email"]').should('not.exist')
		cy.get(CONTACT_TRAVELLER_SELECTORS.BACK_TO_MESSAGES).should('not.exist')
		cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE).should('not.exist')
	})

	it('posts the message and returns to the travellers list', () => {
		cy.intercept('POST', '**/messages/abc.json', {
			body: { name: 'new-id' },
		}).as('contact')
		mountPage()

		sendMessage()

		cy.wait('@contact').its('request.body').should('deep.equal', {
			senderId: 'me',
			message: 'Hello',
			createdAt: API_DATABASE.SERVER_TIMESTAMP,
			read: false,
		})
		cy.get(getByDataCy(TRAVELLERS_STUB)).should('exist')
	})

	it('shows an error dialog and keeps the form when sending fails', () => {
		cy.intercept('POST', '**/messages/abc.json', { statusCode: 500 }).as(
			'contact',
		)
		mountPage()

		sendMessage()

		cy.wait('@contact')
		cy.get(CONTACT_TRAVELLER_SELECTORS.ERROR_DIALOG).should('be.visible')
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('exist')
	})

	describe('reply mode', () => {
		it('shows the reply title, the quoted message and a back link', () => {
			mountPage({ replyTo: REPLY_TO })

			cy.get(CONTACT_TRAVELLER_SELECTORS.TITLE).should(
				'have.text',
				CONTACT_TRAVELLER_CONFIG.REPLY_TITLE('Jane Smith'),
			)
			cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE)
				.should('be.visible')
				.and(
					'contain.text',
					CONTACT_TRAVELLER_CONFIG.REPLY_QUOTE('Jane Smith', null),
				)
				.and('contain.text', REPLY_TO.message)
			cy.get(CONTACT_TRAVELLER_SELECTORS.BACK_TO_MESSAGES)
				.should('have.attr', 'href', PATHS.MESSAGES)
				.and('contain.text', CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES)
		})

		it('goes back to Messages from the back link', () => {
			mountPage({ replyTo: REPLY_TO })

			cy.get(CONTACT_TRAVELLER_SELECTORS.BACK_TO_MESSAGES).click()
			cy.get(getByDataCy(MESSAGES_STUB)).should('exist')
		})

		it('returns to Messages with the reply alert after sending', () => {
			cy.intercept('POST', '**/messages/abc.json*', {
				body: { name: 'new-id' },
			}).as('contact')
			mountPage({ replyTo: REPLY_TO })

			sendMessage()

			cy.wait('@contact')
			cy.get(getByDataCy(MESSAGES_STUB)).should(
				'have.text',
				CONTACT_TRAVELLER_CONFIG.REPLY_SUCCESS_MESSAGE,
			)
		})

		it('has no axe violations', () => {
			mountPage({ replyTo: REPLY_TO })

			cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE).should('be.visible')
			cy.checkA11y()
		})
	})
})
