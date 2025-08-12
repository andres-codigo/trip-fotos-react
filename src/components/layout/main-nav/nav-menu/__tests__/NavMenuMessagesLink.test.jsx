import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { createClassNamesMock } from '@/testUtils/vitest/mockClassNames'

/**
 * NavMenuMessagesLink Unit Tests
 *
 * Mocks:
 * - NavMenuButtonLink: Simplified mock that renders button with forwarded props
 * - classNames: Utility function mock for CSS class combination
 * - CSS Module: Provides stable mock class names for styling tests
 *
 * Test Coverage:
 * - Message count display: Conditional rendering based on totalMessages prop
 * - Class name combination: CSS class merging with NavMenuButtonLink styles
 * - Prop forwarding: Ensures all required props are passed to NavMenuButtonLink
 * - Structure: Proper list item wrapper and data attributes
 *
 * Note: NavMenuButtonLink behavior (click handling, viewport, accessibility)
 * is already covered in NavMenuButtonLink.test.jsx
 */

import NavMenuMessagesLink from '../NavMenuMessagesLink'

vi.mock('../NavMenuButtonLink', () => ({
	default: vi.fn(({ children, className, 'data-cy': dataCy, ...props }) => {
		// Filter out React-specific props that shouldn't appear on DOM elements
		const {
			// isLink, onMenuItemClick, and to are extracted but not used - this is intentional for prop filtering
			// eslint-disable-next-line no-unused-vars
			isLink: _isLink,
			// eslint-disable-next-line no-unused-vars
			onMenuItemClick: _onMenuItemClick,
			// eslint-disable-next-line no-unused-vars
			to: _to,
			...domProps
		} = props
		return (
			<button
				className={className}
				data-cy={dataCy}
				{...domProps}>
				{children}
			</button>
		)
	}),
}))

vi.mock('classnames', () => ({
	default: createClassNamesMock(),
}))

vi.mock('../NavMenuButtonLink.module.scss', () => ({
	default: {
		totalMessagesContainer: 'mocked-total-messages-container',
		totalMessages: 'mocked-total-messages',
	},
}))

import NavMenuButtonLink from '../NavMenuButtonLink'
import classNames from 'classnames'

const mockNavMenuButtonLink = vi.mocked(NavMenuButtonLink)
const mockClassNames = vi.mocked(classNames)

describe('<NavMenuMessagesLink />', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockClassNames.mockImplementation((...args) => {
			return args
				.filter(Boolean)
				.map((arg) => {
					// Handle CSS module objects
					if (typeof arg === 'object' && arg !== null) {
						return Object.values(arg).join(' ')
					}
					return arg
				})
				.join(' ')
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

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
			expect(listItem).toHaveClass('navMenuItemMessages')
		})

		it('should forward all props to NavMenuButtonLink', () => {
			render(<NavMenuMessagesLink {...defaultProps} />)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				{
					children: ['Messages', false],
					className:
						'mocked-total-messages-container mocked-total-messages',
					'data-cy': 'messages-link',
					isLink: true,
					onMenuItemClick: defaultProps.onMenuItemClick,
					to: '/messages',
				},
				undefined,
			)
		})

		it('should combine className with navMenuButtonLinkStyles', () => {
			mockClassNames.mockReturnValue('custom-class combined-styles')

			render(
				<NavMenuMessagesLink
					{...defaultProps}
					className="custom-class"
				/>,
			)

			expect(mockClassNames).toHaveBeenCalledWith(
				'custom-class',
				expect.anything(),
			)

			expect(mockNavMenuButtonLink).toHaveBeenCalledWith(
				{
					children: ['Messages', false],
					className: 'custom-class combined-styles',
					'data-cy': 'messages-link',
					isLink: true,
					onMenuItemClick: defaultProps.onMenuItemClick,
					to: '/messages',
				},
				undefined,
			)
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
					children: ['Messages', false],
					className:
						'mocked-total-messages-container mocked-total-messages',
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

		it('should apply correct CSS classes to message count elements', () => {
			render(
				<NavMenuMessagesLink
					{...defaultProps}
					totalMessages={3}
				/>,
			)

			const messageElement = screen.getByTestId('total-messages')
			const container = messageElement.parentElement

			expect(container).toHaveClass('mocked-total-messages-container')
			expect(messageElement).toHaveClass('mocked-total-messages')
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
