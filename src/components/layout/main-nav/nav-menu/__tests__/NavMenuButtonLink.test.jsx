import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * NavMenuButtonLink Unit Tests
 *
 * Mocks:
 * - BaseButton: Simplified version that filters out React-specific props (isLink, isError, isDisabled, to)
 *   and renders as native button element to prevent DOM attribute warnings
 * - useViewport: Mocked hook that controls mobile/desktop behavior for conditional click handling
 * - classNames: Utility function mock that combines CSS classes for styling tests
 * - CSS Module: Provides stable mock class names (primary, secondary) for modeType styling tests
 *
 * Test Coverage:
 * - Rendering: Component output, prop forwarding, default values, and CSS class application
 * - Behaviour: Click handling logic, mobile vs desktop interactions, viewport responsiveness
 * - Accessibility: Focus management for error states and keyboard navigation support
 */

import NavMenuButtonLink from '../NavMenuButtonLink'

vi.mock('@/components/ui/button/BaseButton', () => ({
	default: vi.fn(
		({
			children,
			className,
			onClick,
			isLink,
			isError,
			isDisabled,
			to,
			...props
		}) => (
			<button
				className={className}
				onClick={onClick}
				data-testid="base-button"
				{...props}>
				{children}
			</button>
		),
	),
}))

vi.mock('@/utils/useViewport', () => ({
	default: vi.fn(),
}))

vi.mock('classnames', () => ({
	default: vi.fn((...args) => args.filter(Boolean).join(' ')),
}))

vi.mock('../NavMenuButtonLink.module.scss', () => ({
	default: {
		primary: 'mocked-primary-class',
		secondary: 'mocked-secondary-class',
	},
}))

import useViewport from '@/utils/useViewport'
import classNames from 'classnames'

const mockUseViewport = vi.mocked(useViewport)
const mockClassNames = vi.mocked(classNames)

describe('<NavMenuButtonLink />', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseViewport.mockReturnValue({ isMobile: false })
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	const defaultProps = {
		children: 'Test Button',
	}

	describe('Rendering tests', () => {
		it('should render children correctly', () => {
			render(<NavMenuButtonLink {...defaultProps} />)

			expect(screen.getByText('Test Button')).toBeInTheDocument()
		})

		it('should render with default props', () => {
			render(<NavMenuButtonLink {...defaultProps} />)

			const button = screen.getByTestId('base-button')
			expect(button).toBeInTheDocument()
		})

		it('should pass through all props to BaseButton', () => {
			const props = {
				...defaultProps,
				isLink: true,
				isError: true,
				isDisabled: true,
				modeType: 'primary',
				to: '/test',
				className: 'test-class',
				'data-cy': 'test-button',
			}

			render(<NavMenuButtonLink {...props} />)

			const button = screen.getByTestId('base-button')
			expect(button).toHaveAttribute('data-cy', 'test-button')
		})

		it('should use default values for optional props', () => {
			render(<NavMenuButtonLink {...defaultProps} />)

			const button = screen.getByTestId('base-button')
			expect(button).toBeInTheDocument()
		})

		it('should apply className correctly with modeType', () => {
			mockClassNames.mockReturnValue('combined-classes')

			render(
				<NavMenuButtonLink
					{...defaultProps}
					className="custom-class"
					modeType="primary"
				/>,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				'custom-class',
				'mocked-primary-class',
			)
		})

		it('should handle modeType styling', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					modeType="secondary"
				/>,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				undefined, // no custom className
				'mocked-secondary-class',
			)
		})

		it('should handle undefined modeType', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					modeType="nonexistent"
				/>,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				undefined,
				undefined, // mocked styles don't have 'nonexistent' key
			)
		})
	})

	describe('Behaviour tests', () => {
		it('should call onClick when provided', () => {
			const mockOnClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					onClick={mockOnClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnClick).toHaveBeenCalledTimes(1)
		})

		it('should call onMenuItemClick when isLink=true, isMobile=true, and onMenuItemClick is provided', () => {
			mockUseViewport.mockReturnValue({ isMobile: true })
			const mockOnMenuItemClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={true}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).toHaveBeenCalledTimes(1)
		})

		it('should not call onMenuItemClick when not mobile', () => {
			mockUseViewport.mockReturnValue({ isMobile: false })
			const mockOnMenuItemClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={true}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).not.toHaveBeenCalled()
		})

		it('should not call onMenuItemClick when isLink=false', () => {
			mockUseViewport.mockReturnValue({ isMobile: true })
			const mockOnMenuItemClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={false}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).not.toHaveBeenCalled()
		})

		it('should call both onMenuItemClick and onClick when both are provided', () => {
			mockUseViewport.mockReturnValue({ isMobile: true })
			const mockOnClick = vi.fn()
			const mockOnMenuItemClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={true}
					onClick={mockOnClick}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).toHaveBeenCalledTimes(1)
			expect(mockOnClick).toHaveBeenCalledTimes(1)
		})

		it('should respond to viewport changes', () => {
			const mockOnMenuItemClick = vi.fn()
			mockUseViewport.mockReturnValue({ isMobile: false })

			const { rerender } = render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={true}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).not.toHaveBeenCalled()

			// Change to mobile
			mockUseViewport.mockReturnValue({ isMobile: true })
			rerender(
				<NavMenuButtonLink
					{...defaultProps}
					isLink={true}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnMenuItemClick).toHaveBeenCalledTimes(1)
		})
	})

	describe('Accessibility tests', () => {
		it('should focus element when isError is true', () => {
			const { rerender } = render(
				<NavMenuButtonLink
					{...defaultProps}
					isError={false}
				/>,
			)

			const button = screen.getByTestId('base-button')
			expect(button).not.toHaveFocus()

			rerender(
				<NavMenuButtonLink
					{...defaultProps}
					isError={true}
				/>,
			)
			expect(button).toHaveFocus()
		})

		it('should not focus element when isError is false', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					isError={false}
				/>,
			)

			const button = screen.getByTestId('base-button')
			expect(button).not.toHaveFocus()
		})
	})
})
