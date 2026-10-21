import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import ContactTraveller from '@/pages/contact-traveller/ContactTraveller'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'
import { CONTACT_TRAVELLER_CONFIG } from '@/constants/travellers'

describe('<ContactTraveller />', () => {
	const mountPage = () => {
		const store = configureStore({
			reducer: {
				authentication: authenticationReducer,
				messages: messagesReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
					userEmail: 'me@example.com',
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
				<MemoryRouter initialEntries={['/travellers/abc/contact']}>
					<Routes>
						<Route
							path="/travellers/:id/contact"
							element={<ContactTraveller />}
						/>
						<Route
							path="/travellers"
							element={
								<p data-cy="travellers-stub">Travellers</p>
							}
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

	it('names the traveller and prefills the user email', () => {
		mountPage()
		cy.get(CONTACT_TRAVELLER_SELECTORS.TITLE).should(
			'have.text',
			CONTACT_TRAVELLER_CONFIG.TITLE('Ada'),
		)
		cy.get(CONTACT_TRAVELLER_SELECTORS.EMAIL_INPUT).should(
			'have.value',
			'me@example.com',
		)
	})

	it('posts the message and returns to the travellers list', () => {
		cy.intercept('POST', '**/messages/abc.json', {
			body: { name: 'new-id' },
		}).as('contact')
		mountPage()

		sendMessage()

		cy.wait('@contact').its('request.body').should('deep.equal', {
			userEmail: 'me@example.com',
			message: 'Hello',
		})
		cy.get('[data-cy="travellers-stub"]').should('exist')
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
})
