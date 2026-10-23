import { TEXTAREA } from '@/constants/test'

import Textarea from '@/components/ui/form/textarea/Textarea'

describe('<Textarea />', () => {
	it('renders', () => {
		cy.mount(
			<Textarea
				id={TEXTAREA.ID}
				label="Test Label"
				value=""
				onChange={() => {}}
			/>,
		)
		cy.get('textarea').should('exist')
		cy.get('label').should('contain', 'Test Label')
	})

	it('has no axe violations when valid and when showing an error', () => {
		cy.mount(
			<Textarea
				id={TEXTAREA.ID}
				label="Test Label"
				value=""
				onChange={() => {}}
			/>,
		)
		cy.checkA11y()

		cy.mount(
			<Textarea
				id={TEXTAREA.ID}
				label="Test Label"
				value=""
				onChange={() => {}}
				isValid={false}
				message="Error message"
			/>,
		)
		cy.checkA11y()
	})

	it('displays error message when invalid', () => {
		cy.mount(
			<Textarea
				id={TEXTAREA.ID}
				label="Test Label"
				value=""
				onChange={() => {}}
				isValid={false}
				message="Error message"
			/>,
		)
		cy.get('[role="alert"]').should('contain', 'Error message')
	})
})
