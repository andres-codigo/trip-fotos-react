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

	describe('Layout either side of 1024px', () => {
		const rects = () =>
			cy
				.get(TRAVELLER_DETAIL_SELECTORS.COLUMNS)
				.then(($columns) =>
					[...$columns[0].children].map((card) =>
						card.getBoundingClientRect(),
					),
				)
		// Tiles in the first row of the photo grid
		const tilesInFirstRow = () =>
			cy
				.get(`${TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST} > li`)
				.then(($tiles) => {
					const top = $tiles[0].getBoundingClientRect().top
					return [...$tiles].filter(
						(tile) =>
							Math.abs(tile.getBoundingClientRect().top - top) <
							1,
					).length
				})

		it('stacks the profile above the photos in the 640px column at 1023px', () => {
			cy.viewport(1023, 900)
			mountPage()
			rects().then(([profile, photos]) => {
				expect(profile.width).to.be.closeTo(640, 1)
				expect(photos.left).to.be.closeTo(profile.left, 1)
				expect(photos.top).to.be.greaterThan(profile.bottom)
			})
			tilesInFirstRow().should('equal', 3)
		})

		it('puts the profile in a 380px left column beside the photos from 1024px, three across', () => {
			cy.viewport(1024, 900)
			mountPage()
			rects().then(([profile, photos]) => {
				expect(profile.width).to.be.closeTo(380, 1)
				expect(photos.left - profile.right).to.be.closeTo(24, 1)
				expect(photos.top).to.be.closeTo(profile.top, 1)
			})
			tilesInFirstRow().should('equal', 3)
		})

		it('widens to the 1160px grid with four photos across at 1280px', () => {
			cy.viewport(1280, 900)
			mountPage()
			cy.get(TRAVELLER_DETAIL_SELECTORS.LAYOUT)
				.invoke('outerWidth')
				.should('be.closeTo', 1160, 1)
			rects().then(([profile, photos]) => {
				expect(profile.width).to.be.closeTo(380, 1)
				expect(photos.right - profile.left).to.be.closeTo(1160, 1)
			})
			tilesInFirstRow().should('equal', 4)
		})

		it('keeps not found in one 640px column at 1280px', () => {
			cy.viewport(1280, 900)
			mountPage({ id: 'nope' })
			cy.get(TRAVELLER_DETAIL_SELECTORS.NOT_FOUND).should('be.visible')
			cy.get(TRAVELLER_DETAIL_SELECTORS.LAYOUT)
				.invoke('outerWidth')
				.should('be.closeTo', 640, 1)
		})

		it('keeps the spinner where the name will be while loading at 1280px', () => {
			cy.intercept('GET', '**/travellers/abc.json', {
				body: traveller,
				delay: 500,
			})
			cy.viewport(1280, 900)
			mountPage()
			// The visible icon, not its full-width wrapper, starts where the name will
			cy.get(
				`${TRAVELLER_DETAIL_SELECTORS.SPINNER} ${COMMON_SELECTORS.BASE_SPINNER_ICON}`,
			).then(($icon) => {
				const left = $icon[0].getBoundingClientRect().left
				cy.get(TRAVELLER_DETAIL_SELECTORS.NAME).should(($name) => {
					expect($name[0].getBoundingClientRect().left).to.be.closeTo(
						left,
						1,
					)
				})
			})
		})
	})
})
