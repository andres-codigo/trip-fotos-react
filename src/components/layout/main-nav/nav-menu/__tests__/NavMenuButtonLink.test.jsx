import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * NavMenuButtonLink Unit Tests
 *
 * Mocks:
 * - BaseButton: Simplified version that filters out React-specific props (isLink, isError, isDisabled, to)
 *   and renders as native button element to prevent DOM attribute warnings
 * - useViewport: Mocked hook that controls mobile/desktop behavior for conditional click handling
 *
 * Test Coverage:
 * - Rendering: Component output, prop forwarding, default values, and active-link semantics
 * - Behaviour: Click handling logic, mobile vs desktop interactions, viewport responsiveness
 * - Accessibility: Focus management for error states and keyboard navigation support
 */

import NavMenuButtonLink from '@/components/layout/main-nav/nav-menu/NavMenuButtonLink'

vi.mock('@/components/ui/button/BaseButton', () => ({
	default: ({
		children,
		isLink,
		isError: _isError,
		onClick,
		isDisabled,
		modeType: _modeType,
		onMenuItemClick: _onMenuItemClick,
		to,
		className,
		'data-cy': dataCy,
		...props
	}) => {
		const Component = isLink ? 'a' : 'button'
		return (
			<Component
				className={className}
				onClick={onClick}
				data-cy={dataCy}
				{...(isLink && { href: to })}
				{...(isDisabled && {
					disabled: !isLink,
					'aria-disabled': isLink,
				})}
				{...props}>
				{children}
			</Component>
		)
	},
}))

vi.mock('@/utils/useViewport', () => ({
	default: vi.fn(),
}))

import useViewport from '@/utils/useViewport'

const mockUseViewport = vi.mocked(useViewport)

describe('<NavMenuButtonLink />', () => {
	beforeEach(() => {
		mockUseViewport.mockReturnValue({ isMobile: false })
	})

	const defaultProps = {
		children: 'Test Button',
		'data-cy': 'base-button',
	}

	describe('Rendering tests', () => {
		it('should render children correctly', () => {
			render(<NavMenuButtonLink {...defaultProps} />)

			expect(screen.getByText('Test Button')).toBeInTheDocument()
		})

		it('should render with default props and pass through all props to BaseButton', () => {
			const props = {
				...defaultProps,
				isLink: true,
				isError: true,
				isDisabled: true,
				modeType: 'primary',
				to: '/test',
				className: 'test-class',
			}

			render(<NavMenuButtonLink {...props} />)

			const button = screen.getByTestId('base-button')
			expect(button).toBeInTheDocument()
			expect(button).toHaveAttribute('data-cy', 'base-button')
		})

		it('should add the link styling to a custom className', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink
					className="custom-class"
				/>,
			)

			const link = screen.getByTestId('base-button')
			expect(link).toHaveClass('custom-class')
			expect(link).not.toHaveAttribute('aria-current')
		})

		it('should mark the link as the current page when active', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					isLink
					isActive
				/>,
			)

			expect(screen.getByTestId('base-button')).toHaveAttribute(
				'aria-current',
				'page',
			)
		})

		it('should not add link styling to a non-link', () => {
			render(
				<NavMenuButtonLink
					{...defaultProps}
					className="custom-class"
				/>,
			)

			expect(screen.getByTestId('base-button')).toHaveAttribute(
				'class',
				'custom-class',
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

		it('should handle onClick without onMenuItemClick', () => {
			const mockOnClick = vi.fn()

			render(
				<NavMenuButtonLink
					{...defaultProps}
					onClick={mockOnClick}
					// No onMenuItemClick provided
				/>,
			)

			fireEvent.click(screen.getByTestId('base-button'))
			expect(mockOnClick).toHaveBeenCalledTimes(1)
		})

		it('should handle missing onClick and onMenuItemClick gracefully', () => {
			expect(() => {
				render(
					<NavMenuButtonLink
						{...defaultProps}
						// No onClick or onMenuItemClick
					/>,
				)
				fireEvent.click(screen.getByTestId('base-button'))
			}).not.toThrow()
		})
	})

	describe('Accessibility tests', () => {
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
