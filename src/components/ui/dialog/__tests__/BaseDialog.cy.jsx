import { DIALOG } from '@/constants/test'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

describe('<BaseDialog />', () => {
	describe('Rendering tests', () => {
		it('has no axe violations', () => {
			cy.mount(
				<BaseDialog
					show
					title="Dialog Title"
					onClose={cy.stub()}
					data-cy={DIALOG.ID}>
					Dialog content
				</BaseDialog>,
			)
			cy.get(getByDataCy(DIALOG.ID)).should('exist')
			cy.checkA11y()
		})
	})
})
