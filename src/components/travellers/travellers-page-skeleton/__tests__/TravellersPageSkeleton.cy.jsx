import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import configureTestStore from '@/testUtils/configureTestStore'

import TravellersPageSkeleton from '@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton'
import {
	FILTER_SKELETON_SELECTORS,
	TRAVELLERS_PAGE_SKELETON_SELECTORS,
} from '@/constants/test'
import authenticationReducer from '@/store/slices/authenticationSlice'

const mountPage = (token = null) => {
	const store = configureTestStore({
		reducer: { authentication: authenticationReducer },
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token,
			},
		},
	})
	cy.mount(
		<Provider store={store}>
			<MemoryRouter>
				<TravellersPageSkeleton />
			</MemoryRouter>
		</Provider>,
	)
}

describe('<TravellersPageSkeleton />', () => {
	// The page's heading row holds the 44px Refresh button, so the stand-in keeps a slot that size at the row's end
	it('keeps a 44px Refresh slot at the end of the heading row', () => {
		mountPage('token')
		cy.contains('h1', 'Travellers')
			.next()
			.should(($slot) => {
				const slot = $slot[0].getBoundingClientRect()
				const row = $slot[0].parentElement.getBoundingClientRect()
				expect(slot.width).to.equal(44)
				expect(slot.height).to.equal(44)
				expect(slot.right).to.equal(row.right)
			})
	})

	it('shows the welcome band above the heading for a visitor', () => {
		mountPage()
		cy.get('[data-cy="travellers-welcome"]').should('be.visible')
		cy.get(TRAVELLERS_PAGE_SKELETON_SELECTORS.ROOT).should('be.visible')
		cy.get(FILTER_SKELETON_SELECTORS.ROOT).should('exist')
	})
})
