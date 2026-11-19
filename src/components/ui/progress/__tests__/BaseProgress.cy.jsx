import { COMMON_SELECTORS } from '@/constants/test'

import BaseProgress from '@/components/ui/progress/BaseProgress'

describe('<BaseProgress />', () => {
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
