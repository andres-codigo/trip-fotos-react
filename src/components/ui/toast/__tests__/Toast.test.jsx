import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { TOAST } from '@/constants/test'

import { render, screen, fireEvent, act } from '@testing-library/react'
import Toast from '@/components/ui/toast/Toast'

const MESSAGE = 'Message deleted.'

const renderToast = (props = {}) => {
	const onClose = vi.fn()
	const onAction = vi.fn()
	const utils = render(
		<Toast
			message={MESSAGE}
			actionLabel="Undo"
			onAction={onAction}
			onClose={onClose}
			duration={8000}
			{...props}
		/>,
	)
	return { ...utils, onClose, onAction }
}

const advance = (ms) => {
	act(() => {
		vi.advanceTimersByTime(ms)
	})
}

describe('<Toast />', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe('Rendering tests', () => {
		it('puts the message in a status live region', () => {
			renderToast()
			expect(screen.getByRole('status')).toHaveTextContent(MESSAGE)
		})

		it('renders the action and the Dismiss button', () => {
			renderToast()
			expect(
				screen.getByRole('button', { name: 'Undo' }),
			).toBeInTheDocument()
			expect(
				screen.getByRole('button', { name: 'Dismiss' }),
			).toBeInTheDocument()
		})

		it('renders no action button without an actionLabel', () => {
			renderToast({ actionLabel: undefined })
			expect(screen.queryByTestId(TOAST.ACTION)).not.toBeInTheDocument()
			expect(screen.getAllByRole('button')).toHaveLength(1)
		})

		it('renders no action button without onAction', () => {
			renderToast({ onAction: undefined })
			expect(screen.queryByTestId(TOAST.ACTION)).not.toBeInTheDocument()
		})

		it('does not move focus on mount', () => {
			const opener = document.createElement('button')
			document.body.appendChild(opener)
			opener.focus()
			renderToast()
			expect(document.activeElement).toBe(opener)
			opener.remove()
		})

		it('merges className and accepts a custom data-cy', () => {
			renderToast({ className: 'bottom-24', 'data-cy': 'undo-toast' })
			expect(screen.getByTestId('undo-toast')).toHaveClass('bottom-24')
		})
	})

	describe('Timer tests', () => {
		it('calls onClose once when the duration runs out', () => {
			const { onClose } = renderToast()
			advance(7999)
			expect(onClose).not.toHaveBeenCalled()
			advance(1)
			expect(onClose).toHaveBeenCalledTimes(1)
			advance(10000)
			expect(onClose).toHaveBeenCalledTimes(1)
		})

		it('pauses while hovered and resumes with the remaining time', () => {
			const { onClose } = renderToast()
			advance(3000)
			fireEvent.pointerEnter(screen.getByRole('status').parentElement)
			advance(20000)
			expect(onClose).not.toHaveBeenCalled()
			fireEvent.pointerLeave(screen.getByRole('status').parentElement)
			advance(4999)
			expect(onClose).not.toHaveBeenCalled()
			advance(1)
			expect(onClose).toHaveBeenCalledTimes(1)
		})

		it('pauses while focus is inside and resumes when it leaves', () => {
			const { onClose } = renderToast()
			advance(2000)
			const undo = screen.getByRole('button', { name: 'Undo' })
			const dismiss = screen.getByRole('button', { name: 'Dismiss' })
			act(() => undo.focus())
			advance(20000)
			// Moving between the toast's own buttons keeps it paused
			act(() => dismiss.focus())
			advance(20000)
			expect(onClose).not.toHaveBeenCalled()
			act(() => dismiss.blur())
			advance(5999)
			expect(onClose).not.toHaveBeenCalled()
			advance(1)
			expect(onClose).toHaveBeenCalledTimes(1)
		})

		it('stays paused while focused even when the pointer leaves', () => {
			const { onClose } = renderToast()
			const card = screen.getByRole('status').parentElement
			act(() => screen.getByRole('button', { name: 'Dismiss' }).focus())
			fireEvent.pointerEnter(card)
			fireEvent.pointerLeave(card)
			advance(20000)
			expect(onClose).not.toHaveBeenCalled()
		})

		it('does not restart the countdown on re-render', () => {
			const { onClose, rerender } = renderToast()
			advance(5000)
			rerender(
				<Toast
					message="Another message"
					onClose={onClose}
				/>,
			)
			advance(3000)
			expect(onClose).toHaveBeenCalledTimes(1)
		})

		it('does not call onClose on unmount', () => {
			const { onClose, unmount } = renderToast()
			advance(1000)
			unmount()
			advance(20000)
			expect(onClose).not.toHaveBeenCalled()
		})
	})

	describe('Behaviour tests', () => {
		it('calls onClose once when Dismiss is pressed', () => {
			const { onClose, onAction } = renderToast()
			fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
			fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
			advance(20000)
			expect(onClose).toHaveBeenCalledTimes(1)
			expect(onAction).not.toHaveBeenCalled()
		})

		it('calls onAction and not onClose when the action is pressed', () => {
			const { onClose, onAction } = renderToast()
			fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
			advance(20000)
			expect(onAction).toHaveBeenCalledTimes(1)
			expect(onClose).not.toHaveBeenCalled()
		})
	})
})
