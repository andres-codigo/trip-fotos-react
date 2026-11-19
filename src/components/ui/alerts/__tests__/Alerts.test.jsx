import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Alerts from '@/components/ui/alerts/Alerts'

describe('Alerts Component', () => {
	const defaultProps = {
		message: 'Test Alert Message',
		onClose: vi.fn(),
	}

	beforeEach(() => {
		vi.useFakeTimers()
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('renders the message in an alert', () => {
		render(<Alerts {...defaultProps} />)

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Test Alert Message',
		)
	})

	it('starts fade-out on close button click and unmounts after animation ends', () => {
		render(<Alerts {...defaultProps} />)

		const closeButton = screen.getByLabelText('Close message')
		fireEvent.click(closeButton)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('animate-alert-out')
		expect(defaultProps.onClose).not.toHaveBeenCalled()

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('auto-closes using the default duration (5000ms) after animation ends', () => {
		render(<Alerts {...defaultProps} />)

		expect(screen.getByRole('alert')).toBeInTheDocument()

		// Advance time just before closing (4999ms)
		act(() => {
			vi.advanceTimersByTime(4999)
		})
		expect(defaultProps.onClose).not.toHaveBeenCalled()
		expect(screen.getByRole('alert')).toBeInTheDocument()

		// Advance time to trigger close
		act(() => {
			vi.advanceTimersByTime(1)
		})

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('animate-alert-out')
		expect(defaultProps.onClose).not.toHaveBeenCalled()

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it.each([3000, 1000])(
		'auto-closes after a %dms duration and waits for the animation end',
		(duration) => {
			render(
				<Alerts
					{...defaultProps}
					duration={duration}
				/>,
			)

			act(() => {
				vi.advanceTimersByTime(duration)
			})

			const alert = screen.getByRole('alert')
			expect(alert).toHaveClass('animate-alert-out')
			expect(defaultProps.onClose).not.toHaveBeenCalled()

			act(() => {
				fireEvent.animationEnd(alert)
			})

			expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		},
	)

	it('handles missing onClose prop gracefully', () => {
		render(
			<Alerts
				message="No Handler"
				onClose={undefined}
			/>,
		)

		const closeButton = screen.getByLabelText('Close message')

		// Should not throw error and should still unmount after the fade-out animation
		fireEvent.click(closeButton)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('animate-alert-out')

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('stays open when the duration is 0', () => {
		render(
			<Alerts
				{...defaultProps}
				duration={0}
			/>,
		)

		act(() => {
			vi.advanceTimersByTime(60000)
		})

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(defaultProps.onClose).not.toHaveBeenCalled()
	})

	it('cleans up timer on unmount', () => {
		const duration = 5000
		const { unmount } = render(
			<Alerts
				{...defaultProps}
				duration={duration}
			/>,
		)

		unmount()

		// Advance time - onClose should NOT be called because component is unmounted
		act(() => {
			vi.advanceTimersByTime(duration)
		})

		expect(defaultProps.onClose).not.toHaveBeenCalled()
	})
})
