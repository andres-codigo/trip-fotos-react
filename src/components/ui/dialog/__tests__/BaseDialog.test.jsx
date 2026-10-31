import { describe, it, expect, beforeEach, vi } from 'vitest'

import { DIALOG } from '@/constants/test'

/**
 * BaseDialog Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (show/hide, header, actions, fixed)
 * - Verifies correct role, aria attributes, and content rendering
 * - Tests event handling for backdrop click, close button, and Escape key
 * - Ensures the title, description and focus wiring from Radix Dialog
 */

import { render, screen, fireEvent } from '@testing-library/react'
import BaseDialog from '@/components/ui/dialog/BaseDialog'

const defaultProps = {
	show: true,
	onClose: vi.fn(),
	title: 'Dialog Title',
	children: 'Dialog Content',
}

const renderDialog = (props = {}) =>
	render(
		<BaseDialog
			{...defaultProps}
			{...props}
		/>,
	)

describe('<BaseDialog />', () => {
	beforeEach(() => {
		defaultProps.onClose.mockClear()
	})

	describe('Rendering tests', () => {
		it('renders when show is true', () => {
			renderDialog()
			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(screen.getByText(defaultProps.title)).toBeInTheDocument()
			expect(screen.getByText(defaultProps.children)).toBeInTheDocument()
		})

		it('does not render when show is false', () => {
			renderDialog({ show: false })
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		})

		it('renders custom header if provided', () => {
			renderDialog({ header: <div>Custom Header</div> })
			expect(screen.getByText('Custom Header')).toBeInTheDocument()
		})

		it('renders actions if provided', () => {
			renderDialog({ actions: <button>Custom Action</button> })
			expect(screen.getByText('Custom Action')).toBeInTheDocument()
		})

		it('renders default close button if no actions', () => {
			renderDialog()
			expect(
				screen.getByRole('button', { name: /close/i }),
			).toBeInTheDocument()
		})

		it('sets correct role for error dialog', () => {
			renderDialog({ isError: true })
			expect(screen.getByRole('alertdialog')).toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('calls onClose when backdrop is clicked', () => {
			renderDialog()
			fireEvent.click(screen.getByTestId(DIALOG.BACKDROP))
			expect(defaultProps.onClose).toHaveBeenCalled()
		})

		it('does not call onClose when fixed is true and backdrop is clicked', () => {
			renderDialog({ fixed: true })
			fireEvent.click(screen.getByTestId(DIALOG.BACKDROP))
			expect(defaultProps.onClose).not.toHaveBeenCalled()
		})

		it('calls onClose when close button is clicked', () => {
			renderDialog()
			fireEvent.click(screen.getByRole('button', { name: /close/i }))
			expect(defaultProps.onClose).toHaveBeenCalled()
		})

		it('calls onClose when Escape key is pressed', () => {
			renderDialog()
			fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
			expect(defaultProps.onClose).toHaveBeenCalled()
		})

		it('renders the children inside the text content region', () => {
			renderDialog({ sectionClasses: true })
			expect(screen.getByTestId(DIALOG.TEXT_CONTENT)).toHaveTextContent(
				defaultProps.children,
			)
		})

		it('focuses the close button of an error dialog', () => {
			renderDialog({ isError: true })
			expect(screen.getByTestId(DIALOG.BUTTON)).toHaveFocus()
		})

		it('does not call onClose on an outside pointer press, only on a backdrop click', () => {
			renderDialog()
			fireEvent.pointerDown(document.body)
			expect(defaultProps.onClose).not.toHaveBeenCalled()
		})
	})

	describe('Accessibility tests', () => {
		it('sets aria-labelledby and aria-describedby', () => {
			renderDialog()
			const dialog = screen.getByRole('dialog')
			expect(dialog).toHaveAttribute('aria-labelledby')
			expect(dialog).toHaveAttribute('aria-describedby')
			expect(dialog).toHaveAccessibleName(defaultProps.title)
			expect(dialog).toHaveAccessibleDescription(defaultProps.children)
		})
	})
})
