import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

/**
 * Input Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (label, required mark, error message)
 * - Verifies correct attributes, aria properties, and content rendering
 * - Tests event handling for onChange and onBlur
 * - Ensures prop spreading and custom class handling
 */

import Input from '../Input'

describe('<Input />', () => {
	describe('Rendering tests', () => {
		it('renders with minimal required props', () => {
			render(
				<Input
					id="test-input"
					value="abc"
					onChange={() => {}}
				/>,
			)
			const input = screen.getByRole('textbox')
			expect(input).toBeInTheDocument()
			expect(input).toHaveValue('abc')
		})

		it('renders with all props', () => {
			render(
				<Input
					id="full-input"
					label="Full Label"
					type="email"
					value="test@example.com"
					onChange={() => {}}
					onBlur={() => {}}
					isValid={false}
					message="Invalid email"
					disabled={true}
					required={true}
					showRequiredMark={true}
					className="custom-class"
					data-cy="cy-input"
					data-cy-error="cy-error"
				/>,
			)
			const input = screen.getByRole('textbox')
			expect(input).toHaveAttribute('type', 'email')
			expect(input).toBeDisabled()
			expect(input).toHaveClass('custom-class')
			expect(input).toHaveAttribute('aria-required', 'true')
			expect(input).toHaveAttribute('aria-invalid', 'true')
			expect(input).toHaveAttribute(
				'aria-describedby',
				'full-input-error',
			)
			expect(screen.getByText('Full Label')).toBeInTheDocument()
			expect(screen.getByText('*')).toBeInTheDocument()
			expect(screen.getByText('Invalid email')).toBeInTheDocument()
		})

		it('does not render label if not provided', () => {
			render(
				<Input
					id="no-label"
					value=""
					onChange={() => {}}
				/>,
			)
			expect(screen.queryByLabelText(/.+/)).not.toBeInTheDocument()
		})

		it('renders error message and sets aria attributes when invalid', () => {
			render(
				<Input
					id="invalid-input"
					value=""
					onChange={() => {}}
					isValid={false}
					message="Error occurred"
				/>,
			)
			const input = screen.getByRole('textbox')
			expect(input).toHaveAttribute('aria-invalid', 'true')
			expect(screen.getByText('Error occurred')).toBeInTheDocument()
		})

		it('associates label with input using htmlFor and id', () => {
			render(
				<Input
					id="assoc-input"
					label="Associated Label"
					value=""
					onChange={() => {}}
				/>,
			)
			const label = screen.getByText('Associated Label')
			const input = screen.getByRole('textbox')
			expect(label).toHaveAttribute('for', 'assoc-input')
			expect(input).toHaveAttribute('id', 'assoc-input')
		})
	})

	describe('Behaviour tests', () => {
		it('calls onChange when input value changes', () => {
			const handleChange = vi.fn()
			render(
				<Input
					id="change-input"
					value=""
					onChange={handleChange}
				/>,
			)
			const input = screen.getByRole('textbox')
			fireEvent.change(input, { target: { value: 'new' } })
			expect(handleChange).toHaveBeenCalled()
		})

		it('calls onBlur when input loses focus', () => {
			const handleBlur = vi.fn()
			render(
				<Input
					id="blur-input"
					value=""
					onChange={() => {}}
					onBlur={handleBlur}
				/>,
			)
			const input = screen.getByRole('textbox')
			fireEvent.blur(input)
			expect(handleBlur).toHaveBeenCalled()
		})

		it('applies required attribute when required prop is true', () => {
			render(
				<Input
					id="required-input"
					value=""
					onChange={() => {}}
					required={true}
				/>,
			)
			const input = screen.getByRole('textbox')
			expect(input).toBeRequired()
		})

		it('applies disabled attribute when disabled prop is true', () => {
			render(
				<Input
					id="disabled-input"
					value=""
					onChange={() => {}}
					disabled={true}
				/>,
			)
			const input = screen.getByRole('textbox')
			expect(input).toBeDisabled()
		})
	})
})
