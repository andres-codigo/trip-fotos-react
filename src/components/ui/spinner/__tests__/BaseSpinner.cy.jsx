import { COMMON_SELECTORS } from '@/constants/test'

import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

describe('<BaseSpinner />', () => {
	it('has no axe violations', () => {
		cy.mount(<BaseSpinner />)

		cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
		cy.checkA11y()
	})
})
