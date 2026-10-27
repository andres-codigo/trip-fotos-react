import { COMMON_SELECTORS } from '@/constants/test'

import BaseBadge from '@/components/ui/badge/BaseBadge'

const MARKER_COLOURS = {
	tokyo: 'rgb(59, 58, 55)',
	prague: 'rgb(143, 58, 35)',
	sydney: 'rgb(47, 93, 98)',
	canberra: 'rgb(107, 75, 138)',
}

const markerColour = ($badge) =>
	getComputedStyle($badge[0], '::before').backgroundColor

describe('<BaseBadge />', () => {
	it('renders the title visually uppercased', () => {
		cy.mount(<BaseBadge title="Prague" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.should('have.text', 'Prague')
			.and('have.css', 'text-transform', 'uppercase')
	})

	Object.entries(MARKER_COLOURS).forEach(([area, colour]) => {
		it(`marks the ${area} type with its own dot and keeps the label in body text`, () => {
			cy.mount(
				<BaseBadge
					type={area}
					title={area}
				/>,
			)
			cy.get(COMMON_SELECTORS.BASE_BADGE)
				.should('have.css', 'color', 'rgb(31, 30, 29)')
				.then(($badge) => expect(markerColour($badge)).to.eq(colour))
		})
	})

	it('uses a neutral dot without a type', () => {
		cy.mount(<BaseBadge title="Other" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE).then(($badge) =>
			expect(markerColour($badge)).to.eq('rgb(94, 93, 89)'),
		)
	})
})
