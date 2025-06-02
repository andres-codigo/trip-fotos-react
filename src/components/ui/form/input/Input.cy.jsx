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

	it('renders as disabled when disabled prop is true', () => {
		cy.mount(
			<Input
				id={TEST_IDS.INPUT}
				label="Disabled Input"
				value="Can't edit"
				onChange={() => {}}
				isValid={true}
				dataCyInput={TEST_IDS.INPUT}
				disabled={true}
			/>,
		)
		cy.get(`[data-cy="${TEST_IDS.INPUT}"]`).should('be.disabled')
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
		cy.get(`[data-cy="${TEST_IDS.INPUT_ERROR}"]`).should(
			'contain',
			'Error!',
		)
	})
})
