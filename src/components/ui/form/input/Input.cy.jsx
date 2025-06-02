import { TEST_IDS } from '@/constants/test-ids'

import Input from './Input'

describe('<Input />', () => {
	it('renders with label and value', () => {
		cy.mount(
			<Input
				id={TEST_IDS.INPUT}
				label="Test Label"
				value="Hello"
				onChange={() => {}}
				isValid={true}
				dataCyInput={TEST_IDS.INPUT}
			/>,
		)
		cy.get('label').should('contain', 'Test Label')
		cy.get(`[data-cy="${TEST_IDS.INPUT}"]`).should('have.value', 'Hello')
	})

	it('renders without a label', () => {
		cy.mount(
			<Input
				id={TEST_IDS.INPUT}
				value="No label"
				onChange={() => {}}
				isValid={true}
				dataCyInput={TEST_IDS.INPUT}
			/>,
		)
		cy.get('label').should('not.exist')
		cy.get(`[data-cy="${TEST_IDS.INPUT}"]`).should('have.value', 'No label')
	})

	it('calls onChange when typing', () => {
		const handleChange = cy.stub().as('onChange')
		cy.mount(
			<Input
				id={TEST_IDS.INPUT}
				label="Test Label"
				value=""
				onChange={handleChange}
				isValid={true}
				dataCyInput={TEST_IDS.INPUT}
			/>,
		)
		cy.get('[data-cy="test-input"]').type('abc')
		cy.get('@onChange').should('have.been.called')
	})

	it('shows error message when invalid', () => {
		cy.mount(
			<Input
				id={TEST_IDS.INPUT}
				label="Test Label"
				value=""
				onChange={() => {}}
				isValid={false}
				message="Error!"
				dataCyInput={TEST_IDS.INPUT}
				dataCyErrorMessage="test"
			/>,
		)
		cy.get('[data-cy="test-error-message"]').should('contain', 'Error!')
	})
})
