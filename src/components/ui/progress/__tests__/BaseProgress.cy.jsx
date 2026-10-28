import { COMMON_SELECTORS } from '@/constants/test'

import BaseProgress from '@/components/ui/progress/BaseProgress'

describe('<BaseProgress />', () => {
	it('shows the bar and label', () => {
		cy.mount(
			<BaseProgress
				value={60}
				label="Uploading photos: 3 of 5 done (60%)"
			/>,
		)

		cy.get(COMMON_SELECTORS.BASE_PROGRESS_BAR)
			.should('be.visible')
			.and('have.attr', 'value', '60')
		cy.get(COMMON_SELECTORS.BASE_PROGRESS_LABEL)
			.should('be.visible')
			.and('have.text', 'Uploading photos: 3 of 5 done (60%)')
	})

	it('has no axe violations', () => {
		cy.mount(
			<BaseProgress
				value={20}
				label="Uploading photos: 1 of 5 done (20%)"
			/>,
		)

		cy.get(COMMON_SELECTORS.BASE_PROGRESS).should('exist')
		cy.checkA11y()
	})
})
