import { COMMON_SELECTORS } from '@/constants/test'
import { TRAVELLER_AREAS } from '@/constants/travellers'

import BaseBadge from '@/components/ui/badge/BaseBadge'

describe('<BaseBadge />', () => {
	it('renders the title visually uppercased', () => {
		cy.mount(<BaseBadge title="Prague" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.should('have.text', 'Prague')
			.and('have.css', 'text-transform', 'uppercase')
	})

	TRAVELLER_AREAS.forEach((area) => {
		it(`renders the ${area} type with white text`, () => {
			cy.mount(
				<BaseBadge
					type={area}
					title={area}
				/>,
			)
			cy.get(COMMON_SELECTORS.BASE_BADGE).should(
				'have.css',
				'color',
				'rgb(255, 255, 255)',
			)
		})
	})

	it('uses the default colour without a type', () => {
		cy.mount(<BaseBadge title="Other" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE).should(
			'have.css',
			'color',
			'rgb(51, 51, 51)',
		)
	})
})
