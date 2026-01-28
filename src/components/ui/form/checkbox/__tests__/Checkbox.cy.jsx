import { CHECKBOX } from '@/constants/test/ui-constants/checkbox'
import { getByDataCy } from '@/testUtils/cypress/selectors'
import Checkbox from '../Checkbox'

describe('<Checkbox />', () => {
	it('renders correctly', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={() => {}}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('input[type="checkbox"]').should('exist')
		cy.get('label').should('contain', 'Test Checkbox')
	})

	it('handles checked state', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={true}
				onChange={() => {}}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get(getByDataCy(CHECKBOX.ID)).should('be.checked')
	})

	it('calls onChange when clicked', () => {
		const onChangeSpy = cy.spy().as('onChangeSpy')
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={onChangeSpy}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get(getByDataCy(CHECKBOX.ID)).click()
		cy.get('@onChangeSpy').should('have.been.called')
	})

	it('calls onChange when label is clicked', () => {
		const onChangeSpy = cy.spy().as('onChangeSpy')
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={onChangeSpy}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('label').click()
		cy.get('@onChangeSpy').should('have.been.called')
	})

	it('displays required mark when required is true', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={() => {}}
				required={true}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('.input-required').should('exist').and('contain', '*')
	})

	it('displays required mark when showRequiredMark is true', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={() => {}}
				showRequiredMark={true}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('.input-required').should('exist').and('contain', '*')
	})

	it('does not display required mark when isArrayItem is true', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={() => {}}
				required={true}
				isArrayItem={true}
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('.input-required').should('not.exist')
	})

	it('displays error message when invalid', () => {
		cy.mount(
			<Checkbox
				id={CHECKBOX.ID}
				label="Test Checkbox"
				checked={false}
				onChange={() => {}}
				isValid={false}
				message="Error message"
				data-cy={CHECKBOX.ID}
			/>,
		)
		cy.get('[role="alert"]').should('contain', 'Error message')
	})
})
