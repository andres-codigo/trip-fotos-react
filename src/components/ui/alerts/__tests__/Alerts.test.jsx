import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Alerts from '../Alerts'

/**
 * Alerts Unit Tests
 *
 * Test Strategy:
 * - Tests default rendering (success state)
 * - Tests different alert types (error, info)
 * - Tests manual closing interaction
 * - Tests auto-closing behavior with timers
 * - Verifies correct ARIA roles and attributes
 */

// Mock CSS Modules
vi.mock('../Alerts.module.scss', () => ({
	default: {
		container: 'container',
		success: 'success',
		error: 'error',
		info: 'info',
		fadeOut: 'fadeOut',
		closeButton: 'closeButton',
	},
}))

// Mock BaseButton to focus on Alerts logic
vi.mock('@/components/ui/button/BaseButton', () => ({
	default: ({ children, onClick, className, 'aria-label': ariaLabel }) => (
		<button
			onClick={onClick}
			className={className}
			aria-label={ariaLabel}>
			{children}
		</button>
	),
}))

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

	it('renders correctly with default props', () => {
		render(<Alerts {...defaultProps} />)

		const alert = screen.getByRole('alert')
		expect(alert).toBeInTheDocument()
		expect(alert).toHaveClass('container')
		expect(alert).toHaveClass('success') // Default type
		expect(screen.getByText('Test Alert Message')).toBeInTheDocument()
	})

	it('renders correctly with "error" type', () => {
		render(
			<Alerts
				{...defaultProps}
				type="error"
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('error')
	})

	it('renders correctly with "info" type', () => {
		render(
			<Alerts
				{...defaultProps}
				type="info"
			/>,
		)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('info')
	})

	it('starts fade-out on close button click and unmounts after animation ends', () => {
		render(<Alerts {...defaultProps} />)

		const closeButton = screen.getByLabelText('Close message')
		fireEvent.click(closeButton)

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('fadeOut')
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
		expect(alert).toHaveClass('fadeOut')
		expect(defaultProps.onClose).not.toHaveBeenCalled()

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('auto-closes after specified duration and waits for animation end', () => {
		const duration = 3000
		render(
			<Alerts
				{...defaultProps}
				duration={duration}
			/>,
		)

		expect(screen.getByRole('alert')).toBeInTheDocument()

		act(() => {
			vi.advanceTimersByTime(duration)
		})

		const alert = screen.getByRole('alert')
		expect(alert).toHaveClass('fadeOut')
		expect(defaultProps.onClose).not.toHaveBeenCalled()

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

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
		expect(alert).toHaveClass('fadeOut')

		act(() => {
			fireEvent.animationEnd(alert)
		})

		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('updates visibility logic correctly when duration triggers closing', () => {
		const duration = 1000
		render(
			<Alerts
				{...defaultProps}
				duration={duration}
			/>,
		)

		act(() => {
			vi.advanceTimersByTime(duration)
		})

		// The component should remain mounted until the fade-out animation ends
		expect(screen.getByRole('alert')).toBeInTheDocument()

		act(() => {
			fireEvent.animationEnd(screen.getByRole('alert'))
		})

		expect(screen.queryByRole('alert')).toBeNull()
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
