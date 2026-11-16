import { CHANGE_PASSWORD_FORM_SELECTORS } from '@/constants/test'

import ChangePasswordForm from '@/components/forms/change-password/ChangePasswordForm'

describe('<ChangePasswordForm />', () => {
	const mount = () =>
		cy.mount(
			<ChangePasswordForm
				onSubmit={cy.stub().resolves()}
				onCancel={cy.stub()}
			/>,
		)

	it('has no axe violations', () => {
		mount()
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})
})
