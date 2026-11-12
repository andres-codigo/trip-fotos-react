import { INPUT } from '@/constants/test'

import Input from '@/components/ui/form/input/Input'

describe('<Input />', () => {
	it('has no axe violations when valid and when showing an error', () => {
		cy.mount(
			<Input
				id={INPUT.ID}
				label="Test Label"
				value="Hello"
				onChange={() => {}}
				isValid={true}
			/>,
		)
		cy.checkA11y()

		cy.mount(
			<Input
				id={INPUT.ID}
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
