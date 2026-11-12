import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { TRAVELLERS_LIST_SELECTORS } from '@/constants/test'

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

describe('<TravellersList />', () => {
	it('has no axe violations', () => {
		mountList({ travellers: alreadyLoaded() })

		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
		cy.checkA11y()
	})
})
