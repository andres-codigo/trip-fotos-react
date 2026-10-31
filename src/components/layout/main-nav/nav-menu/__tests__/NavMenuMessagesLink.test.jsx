import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

/**
 * NavMenuMessagesLink Unit Tests
 *
 * Mocks:
 * - NavMenuButtonLink: Simplified mock that renders button with forwarded props
 * - CSS Module: Provides stable mock class names for styling tests
 *
 * Test Coverage:
 * - Message count display: Conditional rendering based on totalMessages prop
 * - Class name: passed through unchanged, so the module's key names never leak in as global classes
 * - Prop forwarding: Ensures all required props are passed to NavMenuButtonLink
 * - Structure: Proper list item wrapper and data attributes
 *
 * Note: NavMenuButtonLink behavior (click handling, viewport, accessibility)
 * is already covered in NavMenuButtonLink.test.jsx
 */

import NavMenuMessagesLink from '@/components/layout/main-nav/nav-menu/NavMenuMessagesLink'

vi.mock('@/components/layout/main-nav/nav-menu/NavMenuButtonLink', () => ({
	default: vi.fn(
		({
			children,
			isLink: _isLink,
			to: _to,
			'data-cy': dataCy,
			onMenuItemClick: _onMenuItemClick,
			isActive: _isActive,
			className,
			ariaLabel,
			...props
		}) => {
			return (
				<button
					className={className}
					data-cy={dataCy}
					aria-label={ariaLabel}
					{...props}>
					{children}
				</button>
			)
		},
	),
}))

import NavMenuButtonLink from '@/components/layout/main-nav/nav-menu/NavMenuButtonLink'

const mockNavMenuButtonLink = vi.mocked(NavMenuButtonLink)

describe('<NavMenuMessagesLink />', () => {
	const defaultProps = {
		isLink: true,
		to: '/messages',
		onMenuItemClick: vi.fn(),
		'data-cy': 'messages-link',
	}

	describe('Rendering tests', () => {
		it('should render Messages text', () => {
			render(<NavMenuMessagesLink {...defaultProps} />)

			expect(screen.getByText('Messages')).toBeInTheDocument()
		})

		it('should render with proper list item structure', () => {
			render(<NavMenuMessagesLink {...defaultProps} />)

			const listItem = screen.getByRole('listitem')
			expect(listItem).toContainElement(screen.getByText('Messages'))
		})

		it('should forward all props to NavMenuButtonLink', () => {
			render(<NavMenuMessagesLink {...defaultProps} />)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				{
					ariaLabel: 'Messages',
					children: ['Messages', false],
					'data-cy': 'messages-link',
					isLink: true,
					onMenuItemClick: defaultProps.onMenuItemClick,
					to: '/messages',
				},
				undefined,
			)
		})

		it('should pass className through without the styles object', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					className="custom-class"
				/>,
			)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				expect.objectContaining({ className: 'custom-class' }),
				undefined,
			)
		})

		it('should keep the visible text and the accessible name in step', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					totalMessages={3}
				/>,
			)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				expect.objectContaining({ ariaLabel: 'Messages 3' }),
				undefined,
			)
			expect(screen.getByRole('button')).toHaveTextContent('Messages 3')
		})

		it('should handle missing optional props gracefully', () => {
			const minimalProps = {
				isLink: true,
				to: '/messages',
			}

			render(<NavMenuMessagesLink {...minimalProps} />)

			expect(screen.getByText('Messages')).toBeInTheDocument()
			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				{
					ariaLabel: 'Messages',
					children: ['Messages', false],
					'data-cy': undefined,
					isLink: true,
					onMenuItemClick: undefined,
					to: '/messages',
				},
				undefined,
			)
		})

		// Message count tests
		it('should not display message count when totalMessages is falsy', () => {
			const falsyValues = [0, null, undefined, -1]

			falsyValues.forEach((value) => {
				const { unmount } = render(
					<NavMenuMessagesLink
						{...defaultProps}
						totalMessages={value}
					/>,
				)

				expect(
					screen.queryByTestId('total-messages'),
				).not.toBeInTheDocument()

				unmount()
			})
		})

		it('should display message count when totalMessages > 0', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					totalMessages={5}
				/>,
			)

			const messageCount = screen.getByTestId('total-messages')
			expect(messageCount).toBeInTheDocument()
			expect(messageCount).toHaveTextContent('5')
		})

		it('should nest the count inside the link', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					totalMessages={3}
				/>,
			)

			expect(screen.getByRole('button')).toContainElement(
				screen.getByTestId('total-messages'),
			)
		})

		it('should display large message counts correctly', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					totalMessages={999}
				/>,
			)

			expect(screen.getByTestId('total-messages')).toHaveTextContent(
				'999',
			)
		})
	})

	describe('Behaviour tests', () => {
		it('should pass custom onMenuItemClick function to NavMenuButtonLink', () => {
			const mockOnMenuItemClick = vi.fn()

			render(
				<NavMenuMessagesLink
					{...defaultProps}
					onMenuItemClick={mockOnMenuItemClick}
				/>,
			)

			// Verify the specific function instance is passed
			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				expect.objectContaining({
					onMenuItemClick: mockOnMenuItemClick,
				}),
				undefined,
			)
		})
	})

	describe('Accessibility tests', () => {
		it('should pass through custom data-cy attribute for testing', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					data-cy="messages-nav-item"
				/>,
			)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				expect.objectContaining({
					'data-cy': 'messages-nav-item',
				}),
				undefined,
			)
		})
	})
})
