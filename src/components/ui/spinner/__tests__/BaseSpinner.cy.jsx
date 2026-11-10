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

	it('shows its loading text beside the spinner', () => {
		cy.mount(<BaseSpinner label={GLOBAL.SPINNER_LABEL.TRAVELLER} />)

		cy.get('[data-cy="base-spinner-label"]')
			.should('have.text', GLOBAL.SPINNER_LABEL.TRAVELLER)
			.and('be.visible')
		cy.get('[data-cy="base-spinner-icon"]').should('be.visible')
	})

	it('has no axe violations', () => {
		cy.mount(<BaseSpinner />)

		cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
		cy.checkA11y()
	})
})
