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

const TRAVELLERS = Object.freeze([
	{
		id: 'abc',
		firstName: 'Ada',
		lastName: 'Lovelace',
		tripStart: '2024-03-05',
		tripEnd: '2024-03-11',
		cities: ['tokyo'],
		files: Array.from(
			{ length: 5 },
			(_, i) => `https://example.com/${i}.jpg`,
		),
	},
])

describe('<ContactTraveller />', () => {
	const mountPage = (state, travellers = TRAVELLERS) => {
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
					travellers,
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

	describe('Layout either side of 1024px', () => {
		const sideAndForm = () =>
			cy
				.get(CONTACT_TRAVELLER_SELECTORS.COLUMNS)
				.then(($columns) =>
					[...$columns[0].children].map((child) =>
						child.getBoundingClientRect(),
					),
				)

		it('shows the traveller as one line above the Message field at 1023px', () => {
			cy.viewport(1023, 900)
			mountPage()
			cy.get(CONTACT_TRAVELLER_SELECTORS.RECIPIENT).should(
				'contain.text',
				'Ada Lovelace',
			)
			cy.contains('You’re writing to').should('not.be.visible')
			cy.get(CONTACT_TRAVELLER_SELECTORS.RECIPIENT_DETAILS).should(
				'not.be.visible',
			)
			sideAndForm().then(([side, form]) => {
				expect(side.width).to.be.closeTo(form.width, 1)
				expect(form.top).to.be.at.least(side.bottom)
			})
		})

		it('puts who you are writing to in a 380px left column from 1024px, with three photos and a link to their trip', () => {
			cy.viewport(1024, 900)
			mountPage()
			cy.get(CONTACT_TRAVELLER_SELECTORS.RECIPIENT).should(
				'contain.text',
				'You’re writing to',
			)
			cy.get(
				`${CONTACT_TRAVELLER_SELECTORS.RECIPIENT_DETAILS} li`,
			).should('have.length', 3)
			cy.get(CONTACT_TRAVELLER_SELECTORS.VIEW_TRIP)
				.should('have.attr', 'href', '/travellers/abc')
				.and('have.text', 'View Ada’s trip')
			sideAndForm().then(([side, form]) => {
				expect(side.width).to.be.closeTo(380, 1)
				expect(form.left - side.right).to.be.closeTo(24, 1)
				expect(form.top).to.be.closeTo(side.top, 1)
			})
			cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT)
				.invoke('outerHeight')
				.should('be.closeTo', 220, 1)
		})

		it('keeps the quote above the field at 1023px and beside it from 1024px for a reply', () => {
			cy.viewport(1023, 900)
			mountPage({ replyTo: REPLY_TO })
			cy.get(CONTACT_TRAVELLER_SELECTORS.RECIPIENT).should('not.exist')
			sideAndForm().then(([side, form]) => {
				expect(form.top).to.be.at.least(side.bottom)
			})
			cy.viewport(1024, 900)
			cy.contains('Replying to').should('be.visible')
			sideAndForm().then(([side, form]) => {
				expect(side.width).to.be.closeTo(380, 1)
				expect(form.top).to.be.closeTo(side.top, 1)
			})
		})

		it('stays one 640px column at 1280px when the traveller is not known', () => {
			cy.viewport(1280, 900)
			mountPage(null, [])
			cy.get(CONTACT_TRAVELLER_SELECTORS.RECIPIENT).should('not.exist')
			cy.get(CONTACT_TRAVELLER_SELECTORS.FORM)
				.closest(CONTACT_TRAVELLER_SELECTORS.COLUMNS)
				.parent()
				.invoke('outerWidth')
				.should('be.closeTo', 640, 1)
		})
	})
})
