import { TEXTAREA } from '@/constants/test'

import Textarea from '../Textarea'

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
