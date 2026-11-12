import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import TravellerDetail from '@/pages/traveller-detail/TravellerDetail'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { COMMON_SELECTORS, TRAVELLER_DETAIL_SELECTORS } from '@/constants/test'

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
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
		const store = configureTestStore({
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

	it('brings the photos into view when opened from the see-all link', () => {
		const viewportHeight = 200
		cy.viewport(390, viewportHeight)
		mountPage({ hash: '#photos' })
		// The profile card alone is taller than the viewport, so the heading is only on screen if the page scrolled to it
		cy.get(TRAVELLER_DETAIL_SELECTORS.PHOTOS_HEADING).should(($heading) => {
			const { top } = $heading[0].getBoundingClientRect()
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

	it('puts Message {first name} in the profile card, under the badges', () => {
		mountPage({ isTraveller: true })
		cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE)
			.find(TRAVELLER_DETAIL_SELECTORS.MESSAGE)
			.should('have.attr', 'href', '/travellers/abc/contact')
			.and('have.text', 'Message Ada')
			.then(($message) => {
				cy.get(TRAVELLER_DETAIL_SELECTORS.BADGES).then(($badges) => {
					expect(
						$message[0].getBoundingClientRect().top,
					).to.be.at.least($badges[0].getBoundingClientRect().bottom)
				})
			})
	})

	it('lines the back link up with the left edge of the card on desktop', () => {
		cy.viewport(1280, 800)
		mountPage()
		cy.get(TRAVELLER_DETAIL_SELECTORS.BACK_TO_TRAVELLERS).then(($back) => {
			cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE)
				.closest(COMMON_SELECTORS.BASE_CARD)
				.should(($card) => {
					expect($back[0].getBoundingClientRect().left).to.be.closeTo(
						$card[0].getBoundingClientRect().left,
						1,
					)
				})
		})
	})

	it('puts a 44px Back to travellers link above the profile card', () => {
		mountPage()
		cy.get(TRAVELLER_DETAIL_SELECTORS.BACK_TO_TRAVELLERS)
			.should('have.attr', 'href', '/travellers')
			.and('contain.text', 'Back to travellers')
			.then(($back) => {
				const back = $back[0].getBoundingClientRect()
				expect(back.height).to.be.at.least(44)
				cy.get(TRAVELLER_DETAIL_SELECTORS.PROFILE)
					.closest(COMMON_SELECTORS.BASE_CARD)
					.then(($card) => {
						// Close above the card it leads away from: the link's 8px margin, no card spacing
						const gap =
							$card[0].getBoundingClientRect().top - back.bottom
						expect(gap).to.be.within(0, 12)
					})
			})
	})
})
