import { TEXTAREA } from '@/constants/test'

import Textarea from '@/components/ui/form/textarea/Textarea'

describe('<Textarea />', () => {
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
})
