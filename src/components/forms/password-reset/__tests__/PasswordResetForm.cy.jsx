import { PASSWORD_RESET_FORM_SELECTORS } from '@/constants/test'

import PasswordResetForm from '@/components/forms/password-reset/PasswordResetForm'

describe('<PasswordResetForm />', () => {
	const mount = (props = {}) =>
		cy.mount(
			<PasswordResetForm
				onSubmit={cy.stub()}
				onBack={cy.stub()}
				{...props}
			/>,
		)

	it('has no axe violations in the idle view', () => {
		mount({ error: 'Something went wrong' })
		cy.get(PASSWORD_RESET_FORM_SELECTORS.SUBMIT).click()
		cy.get(PASSWORD_RESET_FORM_SELECTORS.EMAIL_ERROR).should('be.visible')
		cy.checkA11y()
	})

	it('has no axe violations in the sent view', () => {
		mount({ status: 'sent', sentTo: 'name@example.com' })
		cy.get(PASSWORD_RESET_FORM_SELECTORS.SENT_MESSAGE).should('be.visible')
		cy.checkA11y()
	})
})
