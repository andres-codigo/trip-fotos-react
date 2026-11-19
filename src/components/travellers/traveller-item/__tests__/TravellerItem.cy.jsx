import configureTestStore from '@/testUtils/configureTestStore'

import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import { COMMON_SELECTORS, TRAVELLER_ITEM_SELECTORS } from '@/constants/test'

const traveller = {
	id: 'abc',
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
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
	const render = ({
		props = {},
		auth = {},
		isTraveller = false,
		width,
	} = {}) => {
		const store = configureTestStore({
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

		cy.mountWithProviders(
			<ul style={width ? { width } : undefined}>
				<TravellerItem
					{...traveller}
					{...props}
				/>
			</ul>,
			store,
		)
	}

	it('outlines only your own card', () => {
		render()
		cy.get(TRAVELLER_ITEM_SELECTORS.ROOT).should(
			'have.css',
			'outline-style',
			'none',
		)

		render({ auth: { userId: traveller.id } })
		// accent-text, 2px, drawn over the card edge
		cy.get(TRAVELLER_ITEM_SELECTORS.ROOT)
			.should('have.css', 'outline-color', 'rgb(169, 201, 138)')
			.and('have.css', 'outline-width', '2px')
			.and('have.css', 'outline-offset', '-2px')
	})

	// The card is narrow in the grid, so a second row of tiles sits as close as the tiles beside each other
	;[
		[1280, 340],
		[390, 330],
	].forEach(([viewport, width]) => {
		it(`spaces photo rows like the tiles across them at ${viewport}px`, () => {
			cy.viewport(viewport, 900)
			render({ props: { files: photos(4) }, width })
			cy.get(COMMON_SELECTORS.BASE_IMAGE).should(($tiles) => {
				const [first, second] = [...$tiles].map((tile) =>
					tile.getBoundingClientRect(),
				)
				const rowTwo = [...$tiles]
					.map((tile) => tile.getBoundingClientRect())
					.find((rect) => rect.top > first.bottom)
				const across = second.left - first.right
				const down = rowTwo.top - first.bottom
				expect(Math.abs(down - across)).to.be.lessThan(6)
			})
		})
	})

	it('has no axe violations', () => {
		render({ props: { files: photos(1) } })
		cy.get(COMMON_SELECTORS.BASE_IMAGE_BUTTON).should('be.visible')
		cy.checkA11y()
	})
})
