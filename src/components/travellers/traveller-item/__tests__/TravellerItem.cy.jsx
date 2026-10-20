import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import {
	COMMON_SELECTORS,
	TRAVELLER_ITEM,
	TRAVELLER_ITEM_SELECTORS,
} from '@/constants/test'

const traveller = {
	id: 'abc',
	firstName: 'Ada',
	lastName: 'Lovelace',
	description: 'Loves analytical engines',
	daysInCity: 7,
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	files: [],
	registered: '2024-03-05T10:00:00.000Z',
}

const photos = (n) =>
	Array.from({ length: n }, (_, i) => `https://example.com/${i}.jpg`)

describe('<TravellerItem />', () => {
	const render = ({ props = {}, auth = {}, isTraveller = false } = {}) => {
		const store = configureStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId: 'me',
					...auth,
				},
				travellers: {
					...travellersReducer(undefined, { type: '@@init' }),
					isTraveller,
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter>
					<ul>
						<TravellerItem
							{...traveller}
							{...props}
						/>
					</ul>
				</MemoryRouter>
			</Provider>,
		)
	}

	it('renders the traveller content', () => {
		render()
		cy.get(TRAVELLER_ITEM_SELECTORS.NAME).should(
			'have.text',
			'Ada Lovelace',
		)
		cy.get(TRAVELLER_ITEM_SELECTORS.REGISTERED).should(
			'have.text',
			'05 Mar 2024',
		)
		cy.get(TRAVELLER_ITEM_SELECTORS.DESCRIPTION).should(
			'contain.text',
			'Loves analytical engines',
		)
		cy.get(TRAVELLER_ITEM_SELECTORS.DAYS).should(
			'contain.text',
			'Days in city: 7 days',
		)
	})

	it('renders a badge per city', () => {
		render()
		cy.get(COMMON_SELECTORS.BASE_BADGE).should('have.length', 2)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.first()
			.should('contain.text', 'Tokyo, Japan')
	})

	it('caps images at five and shows the see-all link', () => {
		render({ props: { files: photos(7) } })
		cy.get(COMMON_SELECTORS.BASE_IMAGE).should('have.length', 5)
		cy.get(TRAVELLER_ITEM_SELECTORS.SEE_ALL_LINK)
			.should('contain.text', 'See all 7 photos')
			.and('have.attr', 'href', '/travellers/abc')
	})

	it('omits the see-all link for five photos', () => {
		render({ props: { files: photos(5) } })
		cy.get(TRAVELLER_ITEM_SELECTORS.SEE_ALL_LINK).should('not.exist')
	})

	it('shows only the details link for a non-traveller non-admin', () => {
		render()
		cy.get(TRAVELLER_ITEM_SELECTORS.DETAILS).should(
			'have.attr',
			'href',
			'/travellers/abc',
		)
		cy.get(TRAVELLER_ITEM_SELECTORS.CONTACT).should('not.exist')
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).should('not.exist')
	})

	it('shows contact for a registered traveller', () => {
		render({ isTraveller: true })
		cy.get(TRAVELLER_ITEM_SELECTORS.CONTACT).should(
			'have.attr',
			'href',
			'/travellers/abc/contact',
		)
	})

	it('shows delete for admins', () => {
		render({ auth: { isAdmin: true } })
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).should('be.visible')
	})

	it('hides contact and delete on the own record', () => {
		render({ auth: { userId: 'abc', isAdmin: true }, isTraveller: true })
		cy.get(TRAVELLER_ITEM_SELECTORS.CONTACT).should('not.exist')
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).should('not.exist')
	})

	it('shows an error dialog when deletion fails', () => {
		cy.intercept('DELETE', '**/travellers/abc.json*', {
			statusCode: 500,
			body: {},
		})
		render({ auth: { isAdmin: true } })
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).click()
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_CONFIRM).click()
		cy.get(TRAVELLER_ITEM_SELECTORS.ERROR_DIALOG).should('be.visible')
	})

	it('cancels the delete from the keyboard and restores focus', () => {
		cy.intercept('DELETE', '**/travellers/abc.json*').as('deleteTraveller')
		render({ auth: { isAdmin: true } })
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).click()
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('be.visible')
		cy.focused().should(
			'have.attr',
			'data-cy',
			TRAVELLER_ITEM.DELETE_CANCEL,
		)
		cy.get('body').type('{esc}')
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_DIALOG).should('not.exist')
		cy.focused().should('have.attr', 'data-cy', TRAVELLER_ITEM.DELETE)
		cy.get('@deleteTraveller.all').should('have.length', 0)
	})

	it('exposes a heading and accessible image buttons', () => {
		render({ props: { files: photos(1) } })
		cy.get('h3').should('have.text', 'Ada Lovelace')
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should(
			'have.attr',
			'aria-label',
			"View Ada Lovelace's photo",
		)
	})
})
