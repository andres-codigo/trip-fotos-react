import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import {
	TRAVELLER_ITEM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
} from '@/constants/test'

import TravellersList from '@/components/travellers/travellers-list/TravellersList'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const USER_ID = 'me'

const record = (firstName, cities) => ({
	firstName,
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines.',
	daysInCity: 7,
	cities,
	files: [],
	registered: '2024-03-05T10:00:00.000Z',
})

const onServer = {
	ada: record('Ada', ['tokyo']),
	grace: record('Grace', ['prague']),
}

const listed = Object.entries(onServer).map(([id, traveller]) => ({
	id,
	...traveller,
}))

const mountList = ({ travellers = {}, props = {} } = {}) => {
	const store = configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token: 'token',
				userId: USER_ID,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				...travellers,
			},
		},
	})

	cy.mount(
		<Provider store={store}>
			<MemoryRouter>
				<TravellersList {...props} />
			</MemoryRouter>
		</Provider>,
	)
}

// A list fetched moments ago is shown straight away and not reloaded on mount
const alreadyLoaded = (overrides = {}) => ({
	travellers: listed,
	hasTravellers: true,
	lastFetch: Date.now(),
	...overrides,
})

// Six travellers, one with a long description, so a row has cards of different natural heights
const gridTravellers = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, index) => ({
	id,
	...record(`Traveller ${id.toUpperCase()}`, ['tokyo']),
	tripDescription:
		index === 0
			? 'A long trip description that runs over several lines so this card is naturally taller than the others in its row. '.repeat(
					2,
				)
			: 'Short.',
}))

const columnCount = ($items) =>
	new Set(
		[...$items].map((item) =>
			Math.round(item.getBoundingClientRect().left),
		),
	).size

describe('<TravellersList />', () => {
	it('has no axe violations', () => {
		mountList({ travellers: alreadyLoaded() })

		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
		cy.checkA11y()
	})

	// 1 column under 640px, 2 from 640px, 3 from 1024px (the maximum)
	;[
		[390, 1],
		[639, 1],
		[640, 2],
		[768, 2],
		[1023, 2],
		[1024, 3],
		[1280, 3],
	].forEach(([width, columns]) => {
		it(`shows ${columns} column${columns === 1 ? '' : 's'} at ${width}px`, () => {
			cy.viewport(width, 900)
			mountList({
				travellers: alreadyLoaded({ travellers: gridTravellers }),
			})

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				($items) => {
					expect($items).to.have.length(6)
					expect(columnCount($items)).to.equal(columns)
				},
			)
		})
	})

	it('makes the cards in a row equal height, with their actions at the foot', () => {
		cy.viewport(1280, 900)
		mountList({ travellers: alreadyLoaded({ travellers: gridTravellers }) })

		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(($items) => {
			const row = [...$items].slice(0, 3)
			const heights = row.map(
				(item) => item.getBoundingClientRect().height,
			)
			expect(Math.max(...heights) - Math.min(...heights)).to.be.lessThan(
				1,
			)

			const actionBottoms = row.map((item) =>
				Math.round(
					item
						.querySelector(TRAVELLER_ITEM_SELECTORS.VIEW_TRIP)
						.getBoundingClientRect().bottom,
				),
			)
			expect(new Set(actionBottoms).size).to.equal(1)
		})
	})

	it('lays the skeleton cards out in the same grid', () => {
		cy.viewport(1280, 900)
		mountList({ props: { isLoading: true } })

		cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST)
			.children()
			.should(($items) => {
				expect(columnCount($items)).to.equal(3)
			})
	})
})
