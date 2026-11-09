import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'
import { TRAVELLER_SKELETON_SELECTORS } from '@/constants/test'

describe('<TravellerSkeleton />', () => {
	beforeEach(() => {
		cy.mount(
			<ul>
				<TravellerSkeleton />
			</ul>,
		)
	})

	it('is visible and hidden from assistive technology', () => {
		cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT)
			.should('be.visible')
			.and('have.attr', 'aria-hidden', 'true')
	})

	it('renders ten animated blocks', () => {
		cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT)
			.find('.animate-skeleton')
			.should('have.length', 10)
	})
})
