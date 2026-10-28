import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import TravellerDetail from '@/pages/traveller-detail/TravellerDetail'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { COMMON_SELECTORS, TRAVELLER_DETAIL_SELECTORS } from '@/constants/test'

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	description: 'Loves analytical engines',
	daysInCity: 7,
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	files: Array.from({ length: 7 }, (_, i) => `https://example.com/${i}.jpg`),
}

describe('<TravellerDetail />', () => {
	const mountPage = ({
		id = 'abc',
		userId = 'me',
		isTraveller = false,
		search = '',
		hash = '',
	} = {}) => {
		const store = configureStore({
			reducer: {
				authentication: authenticationReducer,
				travellers: travellersReducer,
			},
			preloadedState: {
				authentication: {
					...authenticationReducer(undefined, { type: '@@init' }),
					userId,
				},
				travellers: {
					...travellersReducer(undefined, { type: '@@init' }),
					isTraveller,
				},
			},
		})

		cy.mount(
			<Provider store={store}>
				<MemoryRouter
					initialEntries={[`/travellers/${id}${search}${hash}`]}>
					<Routes>
						<Route
							path="/travellers/:id"
							element={<TravellerDetail />}
						/>
					</Routes>
				</MemoryRouter>
			</Provider>,
		)
	}

	beforeEach(() => {
		cy.intercept('GET', '**/travellers/abc.json', {
			body: traveller,
		}).as('loadTraveller')
		cy.intercept('GET', '**/travellers/nope.json', { body: null })
	})

	it('keeps the placeholder heading hidden while loading, then shows the name inside the profile card', () => {
		cy.intercept('GET', '**/travellers/abc.json', {
			body: traveller,
			delay: 500,
		}).as('slowTraveller')
		mountPage()
		cy.get(TRAVELLER_DETAIL_SELECTORS.NAME)
			.should('have.text', 'Traveller')
			.and('have.css', 'width', '1px')
		cy.wait('@slowTraveller')
		cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE)
			.parent()
			.find(TRAVELLER_DETAIL_SELECTORS.NAME)
			.should('have.text', 'Ada Lovelace')
			.and('not.have.css', 'width', '1px')
	})

	it('renders the profile, badges and every photo', () => {
		mountPage()
		cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(
			'have.text',
			'Ada Lovelace',
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.DESCRIPTION).should(
			'contain.text',
			'Loves analytical engines',
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.DAYS).should(
			'contain.text',
			'Days in city: 7 days',
		)
		cy.get(COMMON_SELECTORS.BASE_BADGE).should('have.length', 2)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.first()
			.should('contain.text', 'Tokyo, Japan')
		cy.get(COMMON_SELECTORS.BASE_IMAGE).should('have.length', 7)
	})

	it('brings the photos into view when opened from the see-all link', () => {
		const viewportHeight = 200
		cy.viewport(390, viewportHeight)
		mountPage({ hash: '#photos' })
		// The profile card alone is taller than the viewport, so the list is only on screen if the page scrolled to it
		cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST).should(($list) => {
			const { top } = $list[0].getBoundingClientRect()
			expect(top).to.be.within(0, viewportHeight)
		})
	})

	it('opens the photo named in the URL', () => {
		mountPage({ search: '?photo=3' })
		cy.get(COMMON_SELECTORS.IMAGE_GALLERY_COUNTER).should(
			'contain',
			'3 of 7',
		)
		cy.get(COMMON_SELECTORS.BASE_IMAGE_FULL).should(
			'have.attr',
			'src',
			'https://example.com/2.jpg',
		)
	})

	it('shows the contact link for a traveller viewing someone else', () => {
		mountPage({ isTraveller: true })
		cy.get(TRAVELLER_DETAIL_SELECTORS.CONTACT).should(
			'have.attr',
			'href',
			'/travellers/abc/contact',
		)
	})

	it('hides the contact section on the own record', () => {
		mountPage({ userId: 'abc', isTraveller: true })
		cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE).should('exist')
		cy.get(TRAVELLER_DETAIL_SELECTORS.CONTACT_SECTION).should('not.exist')
	})

	it('shows the not-found state for an unknown id', () => {
		mountPage({ id: 'nope' })
		cy.get(TRAVELLER_DETAIL_SELECTORS.NOT_FOUND).should(
			'contain.text',
			'Traveller not found.',
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.BACK_LINK).should(
			'have.attr',
			'href',
			'/travellers',
		)
	})
})
