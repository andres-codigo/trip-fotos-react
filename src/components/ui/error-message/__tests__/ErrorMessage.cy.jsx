import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

describe('<ErrorMessage />', () => {
	it('shows the message and has no axe violations', () => {
		cy.mount(<ErrorMessage id="email-error">Invalid email.</ErrorMessage>)

		cy.contains('Invalid email.').should('be.visible')
		cy.checkA11y()
	})
})
