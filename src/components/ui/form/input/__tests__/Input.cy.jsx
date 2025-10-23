import { INPUT } from '@/constants/test'

import { getByDataCy, getByDataCyError } from '@/testUtils/cypress/selectors'

import Input from '@/components/ui/form/input/Input'

describe('<Input />', () => {
	describe('Rendering tests', () => {
		it('renders with label and value', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value="Hello"
					onChange={() => {}}
					isValid={true}
					data-cy={INPUT.ID}
				/>,
			)
			cy.get('label').should('contain', 'Test Label')
			cy.get(getByDataCy(INPUT.ID)).should('have.value', 'Hello')
		})

		it('renders without a label', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					value="No label"
					onChange={() => {}}
					isValid={true}
					data-cy={INPUT.ID}
				/>,
			)
			cy.get('label').should('not.exist')
			cy.get(getByDataCy(INPUT.ID)).should('have.value', 'No label')
		})

		it('applies custom className to the input', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value="Hello"
					onChange={() => {}}
					isValid={true}
					className="my-custom-class"
					data-cy={INPUT.ID}
				/>,
			)
			cy.get(getByDataCy(INPUT.ID)).should(
				'have.class',
				'my-custom-class',
			)
		})

		it('renders required input with asterisk', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Required Field"
					value=""
					onChange={() => {}}
					isValid={true}
					data-cy={INPUT.ID}
					required={true}
				/>,
			)
			cy.get('label').should('contain', 'Required Field')
			cy.get('label .input-required').should('contain', '*')
			cy.get(getByDataCy(INPUT.ID)).should('have.attr', 'required')
		})

		it('sets aria-invalid and aria-describedby on input and id/role on error message when invalid', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value=""
					onChange={() => {}}
					isValid={false}
					message="Error!"
					data-cy={INPUT.ID}
					dataCypressError={INPUT.ERROR_ID}
				/>,
			)
			cy.get(getByDataCy(INPUT.ID))
				.should('have.attr', 'aria-invalid', 'true')
				.and('have.attr', 'aria-describedby', `${INPUT.ID}-error`)
			cy.get(`#${INPUT.ID}-error`)
				.should('have.attr', 'role', 'alert')
				.and('contain', 'Error!')
		})

		it('renders as disabled when disabled prop is true', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Disabled Input"
					value="Can't edit"
					onChange={() => {}}
					isValid={true}
					data-cy={INPUT.ID}
					disabled={true}
				/>,
			)
			cy.get(getByDataCy(INPUT.ID)).should('be.disabled')
		})

		it('renders different input types correctly', () => {
			const types = INPUT.TYPES
			types.forEach((type) => {
				cy.mount(
					<Input
						id={INPUT.ID}
						label={`Type: ${type}`}
						value=""
						onChange={() => {}}
						isValid={true}
						type={type}
						data-cy={INPUT.ID}
					/>,
				)
				cy.get(getByDataCy(INPUT.ID)).should('have.attr', 'type', type)
			})
		})
	})

	describe('Behaviour tests', () => {
		it('calls onChange when typing', () => {
			const handleChange = cy.stub().as('onChange')
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value=""
					onChange={handleChange}
					isValid={true}
					data-cy={INPUT.ID}
				/>,
			)
			cy.get(getByDataCy(INPUT.ID)).type('abc')
			cy.get('@onChange').should('have.been.called')
		})

		it('shows error message when invalid', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value=""
					onChange={() => {}}
					isValid={false}
					message="Error!"
					data-cy={INPUT.ID}
					data-cy-error={INPUT.ERROR_ID}
				/>,
			)
			cy.get(getByDataCyError(INPUT.ERROR_ID)).should('contain', 'Error!')
		})
	})

	describe('Accessibility tests', () => {
		it('associates label with input using htmlFor and id', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value="Hello"
					onChange={() => {}}
					isValid={true}
					data-cy={INPUT.ID}
				/>,
			)
			cy.get('label').should('have.attr', 'for', INPUT.ID)
			cy.get(`#${INPUT.ID}`).should('exist')
		})

		it('sets aria-invalid and aria-describedby on input and id/role on error message when invalid', () => {
			cy.mount(
				<Input
					id={INPUT.ID}
					label="Test Label"
					value=""
					onChange={() => {}}
					isValid={false}
					message="Error!"
					data-cy={INPUT.ID}
					dataCypressError={INPUT.ERROR_ID}
				/>,
			)
			cy.get(getByDataCy(INPUT.ID))
				.should('have.attr', 'aria-invalid', 'true')
				.and('have.attr', 'aria-describedby', `${INPUT.ID}-error`)
			cy.get(`#${INPUT.ID}-error`)
				.should('have.attr', 'role', 'alert')
				.and('contain', 'Error!')
		})
	})
})
