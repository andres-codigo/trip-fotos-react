import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import ContactTraveller from '@/pages/contact-traveller/ContactTraveller'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'

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
					</Routes>
				</MemoryRouter>
			</Provider>,
		)
	}

	it('has no axe violations in reply mode', () => {
		mountPage({ replyTo: REPLY_TO })

		cy.get(CONTACT_TRAVELLER_SELECTORS.REPLY_QUOTE).should('be.visible')
		cy.checkA11y()
	})
})
