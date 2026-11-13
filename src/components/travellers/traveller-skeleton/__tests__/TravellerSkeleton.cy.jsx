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

	// The same size as the card's initials avatar, so nothing shifts on load
	it('heads the card with a 40px avatar circle', () => {
		cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT)
			.find('span')
			.first()
			.should(($circle) => {
				const { width, height } = $circle[0].getBoundingClientRect()
				expect(width).to.equal(40)
				expect(height).to.equal(40)
			})
	})
})
