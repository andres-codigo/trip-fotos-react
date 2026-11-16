import { CHANGE_EMAIL_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { CHANGE_EMAIL_FORM_SELECTORS } from '@/constants/test'

import ChangeEmailForm from '@/components/forms/change-email/ChangeEmailForm'

describe('<ChangeEmailForm />', () => {
	const mount = (props = {}) =>
		cy.mount(
			<ChangeEmailForm
				currentEmail="ana@example.com"
				onSubmit={cy.stub().resolves('')}
				onCancel={cy.stub()}
				{...props}
			/>,
		)

	it('has no axe violations', () => {
		mount()
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('has no axe violations with field errors and a form alert', () => {
		mount({ initialError: ERROR_MESSAGES.EMAIL_CANNOT_BE_USED })
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.ALERT).should('be.visible')
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.SEND_LINK).click()
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.NEW_EMAIL_ERROR).should('be.visible')
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.CURRENT_PASSWORD_ERROR).should(
			'contain.text',
			CHANGE_EMAIL_CONFIG.CURRENT_REQUIRED,
		)
		cy.checkA11y()
	})
})
