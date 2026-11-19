import configureTestStore from '@/testUtils/configureTestStore'

import TravellersPageSkeleton from '@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton'
import { TRAVELLERS_WELCOME_SELECTORS } from '@/constants/test'
import authenticationReducer from '@/store/slices/authenticationSlice'

const mountPage = (userId = null) => {
	const store = configureTestStore({
		reducer: { authentication: authenticationReducer },
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId,
			},
		},
	})
	cy.mountWithProviders(<TravellersPageSkeleton />, store)
}

describe('<TravellersPageSkeleton />', () => {
	// The page's heading row holds the 44px Refresh button, so the stand-in keeps a slot that size at the row's end
	it('keeps a 44px Refresh slot at the end of the heading row', () => {
		mountPage('traveller-uid')
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

	it('puts the welcome band above the heading for a visitor', () => {
		mountPage()
		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).then(($welcome) => {
			cy.contains('h1', 'Travellers').should(($heading) => {
				expect($heading[0].getBoundingClientRect().top).to.be.at.least(
					$welcome[0].getBoundingClientRect().bottom,
				)
			})
		})
	})
})
