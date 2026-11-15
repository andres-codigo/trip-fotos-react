import { NEW_PASSWORD_FORM_SELECTORS } from '@/constants/test'

import NewPasswordForm from '@/components/forms/new-password/NewPasswordForm'

describe('<NewPasswordForm />', () => {
	const mount = (onSubmit = cy.stub().resolves('')) =>
		cy.mount(
			<NewPasswordForm
				email="name@example.com"
				onSubmit={onSubmit}
			/>,
		)

	it('has no axe violations with the field error showing', () => {
		mount()
		cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_ERROR).should('be.visible')
		cy.checkA11y()
	})

	it('has no axe violations while saving', () => {
		mount(cy.stub().returns(new Promise(() => {})))
		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).type(
			'secret-password',
		)
		cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()
		cy.get(NEW_PASSWORD_FORM_SELECTORS.PASSWORD_INPUT).should('be.disabled')
		cy.checkA11y()
	})

	it('fills the narrow card width with its Save button below 1024px', () => {
		cy.viewport(390, 800)
		mount()
		cy.get(NEW_PASSWORD_FORM_SELECTORS.ROOT).then(($form) => {
			const formWidth = $form[0].clientWidth
			const padding =
				parseFloat(getComputedStyle($form[0]).paddingLeft) * 2
			cy.get(NEW_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD)
				.invoke('outerWidth')
				.should('be.closeTo', formWidth - padding, 1)
		})
	})
})
