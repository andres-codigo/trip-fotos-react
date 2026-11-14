import TravellersSkeleton from '@/components/travellers/travellers-skeleton/TravellersSkeleton'
import {
	TRAVELLER_SKELETON_SELECTORS,
	TRAVELLERS_SKELETON_SELECTORS,
} from '@/constants/test'

// The grid's breakpoints: one column, two from 640px, three from 1024px
const COLUMNS = [
	[639, 1],
	[640, 2],
	[1023, 2],
	[1024, 3],
]

describe('<TravellersSkeleton />', () => {
	COLUMNS.forEach(([width, columns]) => {
		it(`lays the card skeletons out ${columns} across at ${width}px`, () => {
			cy.viewport(width, 800)
			cy.mount(<TravellersSkeleton />)
			cy.get(TRAVELLERS_SKELETON_SELECTORS.LIST).should('be.visible')
			cy.get(TRAVELLER_SKELETON_SELECTORS.ROOT).should(($cards) => {
				const firstRow = [...$cards].filter(
					(card) =>
						card.getBoundingClientRect().top ===
						$cards[0].getBoundingClientRect().top,
				)
				expect(firstRow).to.have.length(columns)
			})
		})
	})

	it('takes no visible space for the status line', () => {
		cy.mount(<TravellersSkeleton />)
		cy.get(TRAVELLERS_SKELETON_SELECTORS.LOADING).should(($status) =>
			expect($status).to.have.css('position', 'absolute'),
		)
	})
})
