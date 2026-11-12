import { REQUIRED_LEGEND_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'

describe('<RequiredLegend />', () => {
	it('shows the legend with no axe violations', () => {
		cy.mount(<RequiredLegend />)
		cy.get(REQUIRED_LEGEND_SELECTORS.ROOT)
			.should('contain.text', `* ${GLOBAL.REQUIRED_LEGEND}`)
			.and('have.css', 'margin-top', '0px')
		cy.checkA11y()
	})
})
