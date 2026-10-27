import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

/**
 * Textarea Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, conditional rendering and aria wiring
 * - Complements Cypress tests which cover real-browser behaviour and accessibility scenarios
 * - Verifies the label, required mark and error message render only when they should
 * - Tests onChange and onBlur handling, prop spreading and custom class handling
 */

import Textarea from '@/components/ui/form/textarea/Textarea'

const renderTextarea = (props = {}) =>
	render(
		<Textarea
			id="notes"
			value=""
			onChange={() => {}}
			{...props}
		/>,
	)

describe('<Textarea />', () => {
	describe('Rendering tests', () => {
		it('renders with minimal required props', () => {
			renderTextarea({ value: 'hello' })

			const textarea = screen.getByRole('textbox')
			expect(textarea).toHaveValue('hello')
			expect(textarea).toHaveAttribute('id', 'notes')
		})

		it('defaults to three rows and accepts a custom number', () => {
			const { unmount } = renderTextarea()
			expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3')
			unmount()

			renderTextarea({ rows: 8 })
			expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8')
		})

		it('renders the label tied to the textarea', () => {
			renderTextarea({ label: 'Description' })

			expect(screen.getByLabelText('Description')).toBe(
				screen.getByRole('textbox'),
			)
		})

		it('renders no label when none is given', () => {
			renderTextarea()

			expect(screen.queryByText('*')).not.toBeInTheDocument()
			expect(document.querySelector('label')).not.toBeInTheDocument()
		})

		it.each([
			['required', { required: true }],
			['showRequiredMark', { showRequiredMark: true }],
		])('shows the required mark when %s is set', (_, props) => {
			renderTextarea({ label: 'Description', ...props })

			expect(screen.getByText('*')).toBeInTheDocument()
		})

		it('hides the required mark by default', () => {
			renderTextarea({ label: 'Description' })

			expect(screen.queryByText('*')).not.toBeInTheDocument()
		})

		it('merges a custom class name and passes data-cy and other props through', () => {
			renderTextarea({
				className: 'custom',
				'data-cy': 'cy-notes',
				placeholder: 'Write here',
			})

			const textarea = screen.getByRole('textbox')
			expect(textarea).toHaveClass('custom')
			expect(textarea).toHaveAttribute('data-cy', 'cy-notes')
			expect(textarea).toHaveAttribute('placeholder', 'Write here')
		})
	})

	describe('Validation tests', () => {
		it('is valid and has no error message by default', () => {
			renderTextarea({ message: 'ignored while valid' })

			const textarea = screen.getByRole('textbox')
			expect(textarea).toHaveAttribute('aria-invalid', 'false')
			expect(textarea).not.toHaveAttribute('aria-describedby')
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('shows the message as an alert and links it when invalid', () => {
			renderTextarea({
				isValid: false,
				message: 'Message must not be empty.',
				'data-cy-error': 'cy-notes-error',
			})

			const textarea = screen.getByRole('textbox')
			const alert = screen.getByRole('alert')
			expect(textarea).toHaveAttribute('aria-invalid', 'true')
			expect(textarea).toHaveAttribute('aria-describedby', 'notes-error')
			expect(alert).toHaveAttribute('id', 'notes-error')
			expect(alert).toHaveTextContent('Message must not be empty.')
			expect(alert).toHaveAttribute('data-cy-error', 'cy-notes-error')
		})

		it('shows no alert when invalid without a message', () => {
			renderTextarea({ isValid: false })

			expect(screen.getByRole('textbox')).toHaveAttribute(
				'aria-invalid',
				'true',
			)
			expect(screen.getByRole('textbox')).not.toHaveAttribute(
				'aria-describedby',
			)
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('calls onChange when the user types', () => {
			const onChange = vi.fn()
			renderTextarea({ onChange })

			fireEvent.change(screen.getByRole('textbox'), {
				target: { value: 'a' },
			})

			expect(onChange).toHaveBeenCalledTimes(1)
		})

		it('calls onBlur when the textarea loses focus', () => {
			const onBlur = vi.fn()
			renderTextarea({ onBlur })

			fireEvent.blur(screen.getByRole('textbox'))

			expect(onBlur).toHaveBeenCalledTimes(1)
		})

		it('marks the textarea as disabled and required for assistive technology', () => {
			renderTextarea({ disabled: true, required: true })

			const textarea = screen.getByRole('textbox')
			expect(textarea).toBeDisabled()
			expect(textarea).toBeRequired()
			expect(textarea).toHaveAttribute('aria-required', 'true')
		})
	})
})
