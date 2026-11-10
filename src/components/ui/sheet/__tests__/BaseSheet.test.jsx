import { describe, it, expect, beforeEach, vi } from 'vitest'

import { SHEET } from '@/constants/test'

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BaseSheet from '@/components/ui/sheet/BaseSheet'

const defaultProps = {
	show: true,
	onClose: vi.fn(),
	title: 'Filter by city',
	children: 'Sheet content',
}

const renderSheet = (props = {}) =>
	render(
		<BaseSheet
			{...defaultProps}
			{...props}
		/>,
	)

describe('<BaseSheet />', () => {
	beforeEach(() => {
		defaultProps.onClose.mockClear()
	})

	describe('Rendering tests', () => {
		it('renders the title and children when show is true', () => {
			renderSheet()
			expect(screen.getByRole('dialog')).toBeInTheDocument()
			expect(screen.getByTestId(SHEET.TITLE)).toHaveTextContent(
				defaultProps.title,
			)
			expect(screen.getByTestId(SHEET.BODY)).toHaveTextContent(
				defaultProps.children,
			)
		})

		it('renders nothing when show is false', () => {
			renderSheet({ show: false })
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(
				screen.queryByText(defaultProps.title),
			).not.toBeInTheDocument()
		})

		it('renders the title as an h2', () => {
			renderSheet()
			expect(
				screen.getByRole('heading', {
					level: 2,
					name: defaultProps.title,
				}),
			).toBeInTheDocument()
		})

		it('renders the footer when given', () => {
			renderSheet({ footer: <button type="button">Show all</button> })
			expect(screen.getByTestId(SHEET.FOOTER)).toContainElement(
				screen.getByRole('button', { name: 'Show all' }),
			)
		})

		it('renders no footer row without a footer', () => {
			renderSheet()
			expect(screen.queryByTestId(SHEET.FOOTER)).not.toBeInTheDocument()
		})

		it('uses the default data-cy, or the one given', () => {
			const { unmount } = renderSheet()
			expect(screen.getByRole('dialog')).toHaveAttribute(
				'data-cy',
				SHEET.ID,
			)
			unmount()
			renderSheet({ 'data-cy': 'city-sheet' })
			expect(screen.getByRole('dialog')).toHaveAttribute(
				'data-cy',
				'city-sheet',
			)
		})

		it('merges a className onto the sheet', () => {
			renderSheet({ className: 'custom-class' })
			expect(screen.getByRole('dialog')).toHaveClass('custom-class')
		})
	})

	describe('Behaviour tests', () => {
		it('calls onClose when the close button is clicked', () => {
			renderSheet()
			fireEvent.click(screen.getByTestId(SHEET.CLOSE))
			expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		})

		it('calls onClose when Escape is pressed', () => {
			renderSheet()
			fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
			expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		})

		it('calls onClose when the backdrop is clicked', () => {
			renderSheet()
			fireEvent.click(screen.getByTestId(SHEET.BACKDROP))
			expect(defaultProps.onClose).toHaveBeenCalled()
		})

		it('does not call onClose on an outside pointer press, only on a backdrop click', () => {
			renderSheet()
			fireEvent.pointerDown(document.body)
			expect(defaultProps.onClose).not.toHaveBeenCalled()
		})
	})

	describe('Accessibility tests', () => {
		it('names the dialog after its title and marks it modal', () => {
			renderSheet()
			const dialog = screen.getByRole('dialog')
			expect(dialog).toHaveAccessibleName(defaultProps.title)
			expect(dialog).toHaveAttribute('aria-modal', 'true')
		})

		it('gives the close button the default accessible name', () => {
			renderSheet()
			expect(
				screen.getByRole('button', { name: 'Close' }),
			).toBeInTheDocument()
		})

		it('gives the close button a custom accessible name', () => {
			renderSheet({ closeLabel: 'Close city filter' })
			expect(
				screen.getByRole('button', { name: 'Close city filter' }),
			).toBeInTheDocument()
		})

		it('hides the grab handle and close icon from assistive technology', () => {
			renderSheet()
			const dialog = screen.getByRole('dialog')
			expect(dialog.firstElementChild).toHaveAttribute(
				'aria-hidden',
				'true',
			)
			expect(
				screen.getByTestId(SHEET.CLOSE).querySelector('svg'),
			).toHaveAttribute('aria-hidden', 'true')
		})

		it('has no description unless one is given', () => {
			renderSheet()
			expect(screen.getByRole('dialog')).not.toHaveAttribute(
				'aria-describedby',
			)
		})

		it('links a given description', () => {
			renderSheet({ description: 'Choose the cities to show' })
			expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
				'Choose the cities to show',
			)
		})
	})

	describe('Focus', () => {
		it('returns focus to whatever opened it when it closes', async () => {
			const Opener = ({ show }) => (
				<>
					<button type="button">Open</button>
					<BaseSheet
						{...defaultProps}
						show={show}
					/>
				</>
			)
			const { rerender } = render(<Opener show={false} />)
			const opener = screen.getByRole('button', { name: 'Open' })
			opener.focus()

			rerender(<Opener show />)
			expect(opener).not.toHaveFocus()

			rerender(<Opener show={false} />)
			// Radix restores focus on a timeout after the content unmounts
			await waitFor(() => expect(opener).toHaveFocus())
		})
	})
})
