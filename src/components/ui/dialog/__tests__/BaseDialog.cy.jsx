import { DIALOG } from '@/constants/test/dialog'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

describe('<BaseDialog />', () => {
	describe('Rendering tests', () => {
		it('renders with title and children', () => {
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
			cy.get(getByDataCy(DIALOG.TITLE)).should('contain', 'Dialog Title')
			cy.get(getByDataCy(DIALOG.TEXT_CONTENT)).should(
				'contain',
				'Dialog content',
			)
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
			cy.get('body').type('{esc}')
			cy.wrap(onClose).should('have.been.called')
		})
	})

	describe('Accessibility tests', () => {
		it('has role dialog and aria-modal', () => {
			cy.mount(
				<BaseDialog
					show
					title="Dialog"
					onClose={cy.stub()}
					data-cy={DIALOG.ID}>
					Content
				</BaseDialog>,
			)
			cy.get(getByDataCy(DIALOG.ID))
				.should('have.attr', 'role', 'dialog')
				.and('have.attr', 'aria-modal', 'true')
		})

		it('has role alertdialog when isError is true', () => {
			cy.mount(
				<BaseDialog
					show
					isError
					title="Error"
					onClose={cy.stub()}
					data-cy={DIALOG.ID}>
					Error content
				</BaseDialog>,
			)
			cy.get(getByDataCy(DIALOG.ID)).should(
				'have.attr',
				'role',
				DIALOG.ROLE_ALERTDIALOG,
			)
		})

		it('links aria-labelledby and aria-describedby to visible elements', () => {
			cy.mount(
				<BaseDialog
					show
					title="Dialog"
					onClose={cy.stub()}
					data-cy={DIALOG.ID}>
					Some content
				</BaseDialog>,
			)
			cy.get(getByDataCy(DIALOG.ID)).then(($dialog) => {
				const labelledby = $dialog.attr('aria-labelledby')
				const describedby = $dialog.attr('aria-describedby')
				cy.get(`#${labelledby}`).should('contain', 'Dialog')
				cy.get(`#${describedby}`).should('contain', 'Some content')
			})
		})
	})
})
