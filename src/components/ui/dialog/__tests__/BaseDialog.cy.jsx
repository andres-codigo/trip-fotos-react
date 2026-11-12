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

	describe('Behaviour tests', () => {
		it('calls onClose when backdrop is clicked', () => {
			const onClose = cy.stub()
			cy.mount(
				<BaseDialog
					show
					title="Dialog"
					onClose={onClose}
					data-cy={DIALOG.ID}>
					Content
				</BaseDialog>,
			)

			// TODO: Investigate proper solution to not force: true on click
			// Use force: true because the backdrop is covered by content due to CSS positioning,
			// but clicking the backdrop is the intended functionality we need to test
			// eslint-disable-next-line cypress/no-force
			cy.get(getByDataCy(DIALOG.BACKDROP)).click({ force: true })
			cy.wrap(onClose).should('have.been.called')
		})

		it('calls onClose when Escape is pressed', () => {
			const onClose = cy.stub()
			cy.mount(
				<BaseDialog
					show
					title="Dialog"
					onClose={onClose}
					data-cy={DIALOG.ID}>
					Content
				</BaseDialog>,
			)
			cy.get(getByDataCy(DIALOG.ID)).focus().type('{esc}')
			cy.wrap(onClose).should('have.been.called')
		})
	})
})
