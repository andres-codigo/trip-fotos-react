import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import Input from '@/components/ui/form/input/Input'

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
					data-cy-error="cy-error"
				/>,
			)
			const input = screen.getByRole('textbox', { name: /Full Label/ })
			expect(input).toHaveAttribute('id', 'full-input')
			expect(input).toHaveAttribute('type', 'email')
			expect(input).toBeDisabled()
			expect(input).toBeRequired()
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
	})
	describe('Helper text, required mark and password', () => {
		it('reads the helper text before the error, and hides the asterisk from screen readers', () => {
			render(
				<Input
					id="pw"
					label="Password"
					value=""
					onChange={() => {}}
					helpText="At least 6 characters."
					isValid={false}
					message="Enter your password."
					required
				/>,
			)
			const input = screen.getByLabelText(/^Password/, {
				selector: 'input',
			})

			expect(input).toHaveAttribute(
				'aria-describedby',
				'pw-help pw-error',
			)
			expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
		})

		it('puts the error under the label and helper text, before the field, with a hidden "!" icon', () => {
			render(
				<Input
					id="pw"
					label="Password"
					type="password"
					value=""
					onChange={() => {}}
					helpText="At least 6 characters."
					isValid={false}
					message="Enter your password."
				/>,
			)
			const label = screen.getByText(/^Password/, { selector: 'label' })
			const help = screen.getByText('At least 6 characters.')
			const error = screen.getByRole('alert')
			const input = screen.getByLabelText(/^Password/, {
				selector: 'input',
			})

			const follows = (a, b) =>
				Boolean(
					a.compareDocumentPosition(b) &
					Node.DOCUMENT_POSITION_FOLLOWING,
				)
			expect(follows(label, help)).toBe(true)
			expect(follows(help, error)).toBe(true)
			expect(follows(error, input)).toBe(true)
			expect(error).toHaveTextContent('!Enter your password.')
			expect(screen.getByText('!')).toHaveAttribute('aria-hidden', 'true')
		})

		it('shows and hides a password, naming the button after what it does', () => {
			render(
				<Input
					id="pw"
					label="Password"
					type="password"
					value="secret12"
					onChange={() => {}}
				/>,
			)
			const input = screen.getByLabelText(/^Password/, {
				selector: 'input',
			})
			expect(input).toHaveAttribute('type', 'password')

			fireEvent.click(
				screen.getByRole('button', { name: 'Show password' }),
			)
			expect(input).toHaveAttribute('type', 'text')

			fireEvent.click(
				screen.getByRole('button', { name: 'Hide password' }),
			)
			expect(input).toHaveAttribute('type', 'password')
		})

		it('gives other input types no show button', () => {
			render(
				<Input
					id="e"
					label="Email"
					type="email"
					value=""
					onChange={() => {}}
				/>,
			)
			expect(screen.queryByRole('button')).not.toBeInTheDocument()
		})
	})
})
