import { COMMON_SELECTORS } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

describe('<BaseSpinner />', () => {
	it('is announced as a busy status region', () => {
		cy.mount(<BaseSpinner />)

		cy.get(COMMON_SELECTORS.BASE_SPINNER)
			.should('have.attr', 'role', 'status')
			.and('have.attr', 'aria-live', 'polite')
			.and('have.attr', 'aria-busy', 'true')
	})

	it('shows the loading image with its alternative text', () => {
		cy.mount(<BaseSpinner />)

		cy.get('img')
			.should('have.attr', 'alt', GLOBAL.LOADING_SPINNER_ALT)
			.and('be.visible')
	})

	it('has no axe violations', () => {
		cy.mount(<BaseSpinner />)

		cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
		cy.checkA11y()
	})
})
