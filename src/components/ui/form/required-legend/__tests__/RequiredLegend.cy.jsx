import { REQUIRED_LEGEND_SELECTORS } from '@/constants/test'

import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'

describe('<RequiredLegend />', () => {
	it('sits flush with no top margin and has no axe violations', () => {
		cy.mount(<RequiredLegend />)
		cy.get(REQUIRED_LEGEND_SELECTORS.ROOT).should(
			'have.css',
			'margin-top',
			'0px',
		)
		cy.checkA11y()
	})
})
