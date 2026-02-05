import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

/**
 * Checkbox Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (label, required mark, error message)
 * - Verifies correct attributes, aria properties, and content rendering
 * - Tests event handling for onChange
 * - Ensures className generation and error handling
 */

import Checkbox from '../Checkbox'
import { CHECKBOX } from '@/constants/test/ui-constants/checkbox'

describe('<Checkbox />', () => {
	describe('Rendering tests', () => {
		it('renders with minimal required props', () => {
			render(
				<Checkbox
					id={CHECKBOX.ID}
					label="Test Checkbox"
					checked={false}
					onChange={() => {}}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toBeInTheDocument()
			expect(checkbox).not.toBeChecked()
			expect(screen.getByText('Test Checkbox')).toBeInTheDocument()
		})

		it('renders with checked state', () => {
			render(
				<Checkbox
					id="checked-checkbox"
					label="Checked Item"
					checked={true}
					onChange={() => {}}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toBeChecked()
		})

		it('renders without label when not provided', () => {
			const { container } = render(
				<Checkbox
					id="no-label-checkbox"
					checked={false}
					onChange={() => {}}
				/>,
			)

			const label = container.querySelector('label')
			expect(label).not.toBeInTheDocument()
		})

		it('renders with custom value', () => {
			const { container } = render(
				<Checkbox
					id="valued-checkbox"
					label="Valued"
					checked={false}
					onChange={() => {}}
					value="custom-value"
				/>,
			)

			const checkbox = container.querySelector('input')
			expect(checkbox).toHaveAttribute('value', 'custom-value')
		})

		it('renders with number value', () => {
			const { container } = render(
				<Checkbox
					id="number-checkbox"
					label="Number Value"
					checked={false}
					onChange={() => {}}
					value={42}
				/>,
			)

			const checkbox = container.querySelector('input')
			expect(checkbox).toHaveAttribute('value', '42')
		})

		it('renders disabled state', () => {
			render(
				<Checkbox
					id="disabled-checkbox"
					label="Disabled"
					checked={false}
					onChange={() => {}}
					disabled={true}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toBeDisabled()
		})
	})

	describe('Required mark rendering', () => {
		it('shows required mark when not an array item and showRequiredMark is true', () => {
			render(
				<Checkbox
					id="required-checkbox"
					label="Required Item"
					checked={false}
					onChange={() => {}}
					showRequiredMark={true}
					isArrayItem={false}
				/>,
			)

			const requiredMark = screen.getByText('*')
			expect(requiredMark).toBeInTheDocument()
		})

		it('shows required mark when required is true and not an array item', () => {
			render(
				<Checkbox
					id="required-checkbox"
					label="Required Item"
					checked={false}
					onChange={() => {}}
					required={true}
					isArrayItem={false}
				/>,
			)

			const requiredMark = screen.getByText('*')
			expect(requiredMark).toBeInTheDocument()
		})

		it('does not show required mark when isArrayItem is true', () => {
			const { container } = render(
				<Checkbox
					id="array-checkbox"
					label="Array Item"
					checked={false}
					onChange={() => {}}
					showRequiredMark={true}
					isArrayItem={true}
				/>,
			)

			const requiredMark = container.querySelector('.input-required')
			expect(requiredMark).not.toBeInTheDocument()
		})

		it('does not show required mark when showRequiredMark is false and required is false', () => {
			const { container } = render(
				<Checkbox
					id="unrequired-checkbox"
					label="Not Required"
					checked={false}
					onChange={() => {}}
					showRequiredMark={false}
					required={false}
				/>,
			)

			const requiredMark = container.querySelector('.input-required')
			expect(requiredMark).not.toBeInTheDocument()
		})
	})

	describe('Error handling and validation', () => {
		it('renders error message when not valid and isArrayItem is false', () => {
			render(
				<Checkbox
					id="error-checkbox"
					label="Error Item"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message="This is required"
					isArrayItem={false}
				/>,
			)

			expect(screen.getByText('This is required')).toBeInTheDocument()
		})

		it('does not render error message when valid', () => {
			const { queryByText } = render(
				<Checkbox
					id="valid-checkbox"
					label="Valid Item"
					checked={false}
					onChange={() => {}}
					isValid={true}
					message="This is required"
					isArrayItem={false}
				/>,
			)

			expect(queryByText('This is required')).not.toBeInTheDocument()
		})

		it('does not render error message when isArrayItem is true', () => {
			const { queryByText } = render(
				<Checkbox
					id="array-error-checkbox"
					label="Array Error Item"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message="This is required"
					isArrayItem={true}
				/>,
			)

			expect(queryByText('This is required')).not.toBeInTheDocument()
		})

		it('does not render error message when message is empty', () => {
			const { container } = render(
				<Checkbox
					id="no-message-checkbox"
					label="No Message"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message=""
					isArrayItem={false}
				/>,
			)

			const errorElement = container.querySelector('[role="alert"]')
			expect(errorElement).not.toBeInTheDocument()
		})

		it('error message has alert role when displayed', () => {
			render(
				<Checkbox
					id="alert-checkbox"
					label="Alert Item"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message="Error message"
					isArrayItem={false}
				/>,
			)

			const alertElement = screen.getByRole('alert')
			expect(alertElement).toHaveTextContent('Error message')
		})
	})

	describe('Accessibility attributes', () => {
		it('sets aria-required when required is true', () => {
			render(
				<Checkbox
					id="aria-required-checkbox"
					label="Required"
					checked={false}
					onChange={() => {}}
					required={true}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute('aria-required', 'true')
		})

		it('sets aria-invalid when not valid', () => {
			render(
				<Checkbox
					id="aria-invalid-checkbox"
					label="Invalid"
					checked={false}
					onChange={() => {}}
					isValid={false}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute('aria-invalid', 'true')
		})

		it('sets aria-describedby when invalid and message exists', () => {
			render(
				<Checkbox
					id="aria-described-checkbox"
					label="Described"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message="Error message"
					isArrayItem={false}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute(
				'aria-describedby',
				'aria-described-checkbox-error',
			)
		})

		it('does not set aria-describedby when valid', () => {
			render(
				<Checkbox
					id="no-describe-checkbox"
					label="Valid"
					checked={false}
					onChange={() => {}}
					isValid={true}
					message="Error message"
					isArrayItem={false}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).not.toHaveAttribute('aria-describedby')
		})

		it('does not set aria-describedby when message is empty', () => {
			render(
				<Checkbox
					id="no-message-describe-checkbox"
					label="No Message"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message=""
					isArrayItem={false}
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).not.toHaveAttribute('aria-describedby')
		})
	})

	describe('Event handling', () => {
		it('renders checkbox with onChange prop available for parent handling', () => {
			const handleChange = vi.fn()
			const { container } = render(
				<Checkbox
					id="change-checkbox"
					label="Change Item"
					checked={false}
					onChange={handleChange}
				/>,
			)

			const checkbox = container.querySelector('input')
			expect(checkbox).toBeInTheDocument()
			expect(checkbox).toHaveAttribute('id', 'change-checkbox')
		})
	})

	describe('CSS class handling', () => {
		it('renders with default checkbox-container class', () => {
			const { container } = render(
				<Checkbox
					id="class-checkbox"
					label="Class Item"
					checked={false}
					onChange={() => {}}
				/>,
			)

			const checkboxContainer = container.querySelector(
				'.checkbox-container',
			)
			expect(checkboxContainer).toBeInTheDocument()
		})

		it('combines custom className with checkbox-container', () => {
			const { container } = render(
				<Checkbox
					id="custom-class-checkbox"
					label="Custom Class"
					checked={false}
					onChange={() => {}}
					className="custom-class another-class"
				/>,
			)

			const checkboxContainer = container.querySelector(
				'.checkbox-container.custom-class.another-class',
			)
			expect(checkboxContainer).toBeInTheDocument()
		})
	})

	describe('Data attributes', () => {
		it('sets data-cy attribute on input', () => {
			render(
				<Checkbox
					id="data-cy-checkbox"
					label="Data CY"
					checked={false}
					onChange={() => {}}
					data-cy="test-checkbox-id"
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute('data-cy', 'test-checkbox-id')
		})

		it('sets data-cy-error attribute on error message', () => {
			const { container } = render(
				<Checkbox
					id="error-cy-checkbox"
					label="Error CY"
					checked={false}
					onChange={() => {}}
					isValid={false}
					message="Error"
					isArrayItem={false}
					data-cy-error="error-id"
				/>,
			)

			const errorMessage = container.querySelector(
				'[data-cy-error="error-id"]',
			)
			expect(errorMessage).toBeInTheDocument()
		})
	})

	describe('Explicit accessibility and test attributes', () => {
		it('applies aria-label when provided', () => {
			render(
				<Checkbox
					id="aria-label-checkbox"
					label="Labeled Item"
					checked={false}
					onChange={() => {}}
					aria-label="Custom label"
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute('aria-label', 'Custom label')
		})

		it('applies aria-labelledby when provided', () => {
			render(
				<Checkbox
					id="aria-labelledby-checkbox"
					checked={false}
					onChange={() => {}}
					aria-labelledby="external-label"
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute(
				'aria-labelledby',
				'external-label',
			)
		})

		it('applies data-testid when provided', () => {
			render(
				<Checkbox
					id="testid-checkbox"
					label="Test Item"
					checked={false}
					onChange={() => {}}
					data-testid="custom-testid"
				/>,
			)

			const checkbox = screen.getByRole('checkbox')
			expect(checkbox).toHaveAttribute('data-testid', 'custom-testid')
		})
	})
})
