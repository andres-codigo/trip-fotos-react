import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import EditTrip from '@/pages/edit-trip/EditTrip'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import {
	EDIT_TRIP_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
} from '@/constants/test'

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
	cities: ['tokyo'],
	files: ['https://example.com/0.jpg', 'https://example.com/1.jpg'],
}

describe('<EditTrip />', () => {
	const mountPage = () => {
		const store = configureTestStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter initialEntries={['/travellers/me/edit']}>
					<Routes>
						<Route
							path="/travellers/:id/edit"
							element={<EditTrip />}
						/>
					</Routes>
				</MemoryRouter>
			</Provider>,
		)
	}

	const rect = (selector) =>
		cy.get(selector).then(($el) => $el[0].getBoundingClientRect())

	beforeEach(() => {
		cy.intercept('GET', '**/travellers/me.json', { body: traveller })
	})

	describe('Layout either side of 1024px', () => {
		it('puts Delete my profile under the form in the 640px column at 1023px', () => {
			cy.viewport(1023, 900)
			mountPage()
			rect(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).then((form) => {
				expect(form.width).to.be.closeTo(640, 1)
				rect(EDIT_TRIP_SELECTORS.DELETE_SECTION).then((section) => {
					expect(section.top).to.be.greaterThan(form.bottom)
				})
			})
		})

		it('puts Delete my profile under Trip details in the left column from 1024px, after Save', () => {
			cy.viewport(1024, 900)
			mountPage()
			rect(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DETAILS).then(
				(details) => {
					cy.get(EDIT_TRIP_SELECTORS.DELETE_SECTION)
						.closest('[data-cy="base-card"]')
						.then(($card) => {
							const card = $card[0].getBoundingClientRect()
							expect(card.left).to.be.closeTo(details.left, 1)
							expect(card.width).to.be.closeTo(380, 1)
						})
				},
			)
			rect(TRAVELLER_REGISTRATION_FORM_SELECTORS.ACTIONS).then(
				(actions) => {
					rect(EDIT_TRIP_SELECTORS.DELETE)
						.its('top')
						.should('be.greaterThan', actions.bottom)
				},
			)
		})
	})
})
