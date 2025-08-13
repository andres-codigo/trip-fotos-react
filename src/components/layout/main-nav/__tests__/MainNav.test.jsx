import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * MainNav Unit Tests
 *
 * Mocks:
 * - Custom hooks: All navigation-related hooks with controlled return values for state management
 * - NavMenuButtonLink: Mock component that renders as div for testing prop forwarding
 * - NavMenuMessagesLink: Mock component that renders as li for testing message functionality
 * - CSS Modules: Stable mock class names for NavMenuButtonLink styling tests
 *
 * Test Coverage:
 * - Rendering: Hook integration, prop forwarding, conditional rendering based on isLoggedIn
 * - Component Integration: Verification that child components receive correct props
 * - Hook Parameters: Ensures hooks are called with proper arguments and dependencies
 * - Accessibility: N/A (covered in MainNav.cy.jsx)
 *
 * Note: User interactions, DOM events, and accessibility are covered in MainNav.cy.jsx
 */

import MainNav from '../MainNav'

// Mock custom hooks
vi.mock('../hooks/useMainNavState', () => ({
	useMainNavState: vi.fn(),
}))

vi.mock('../hooks/useClickOutsideToClose', () => ({
	useClickOutsideToClose: vi.fn(),
}))

vi.mock('../hooks/useMobileMenu', () => ({
	useMobileMenu: vi.fn(),
}))

vi.mock('../hooks/useLogout', () => ({
	useLogout: vi.fn(),
}))

// Mock child components
vi.mock('../nav-menu/NavMenuButtonLink', () => ({
	default: vi.fn(
		({
			className,
			onClick,
			onMenuItemClick,
			'data-cy': dataCy,
			// isLink and to are extracted but not used - this is intentional for prop filtering
			isLink: _isLink,
			to: _to,
			children,
			...props
		}) => (
			<div
				className={className}
				onClick={onClick || onMenuItemClick}
				data-cy="nav-menu-button-link"
				{...(dataCy && { 'data-cy': dataCy })}
				{...props}>
				{children}
			</div>
		),
	),
}))

vi.mock('../nav-menu/NavMenuMessagesLink', () => ({
	default: vi.fn(
		({
			onMenuItemClick,
			className,
			'data-cy': dataCy,
			// isLink, to, and totalMessages are extracted but not used - this is intentional for prop filtering

			isLink: _isLink,

			to: _to,

			totalMessages: _totalMessages,
			...props
		}) => (
			<li
				onClick={onMenuItemClick}
				data-cy="nav-menu-messages-link"
				className={className}
				{...(dataCy && { 'data-cy': dataCy })}
				{...props}>
				Messages Link
			</li>
		),
	),
}))

import { useMainNavState } from '../hooks/useMainNavState'
import { useClickOutsideToClose } from '../hooks/useClickOutsideToClose'
import { useMobileMenu } from '../hooks/useMobileMenu'
import { useLogout } from '../hooks/useLogout'

import { PATHS } from '@/constants/paths'

import navMenuButtonLinkStyles from '../nav-menu/NavMenuButtonLink.module.scss'

import NavMenuButtonLink from '../nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from '../nav-menu/NavMenuMessagesLink'

describe('<MainNav />', () => {
	const mockTravellerName = 'John Doe'
	const mockTotalMessages = 5

	const mockSetTravellerName = vi.fn()
	const mockSetTotalMessages = vi.fn()
	const mockSetIsMenuOpen = vi.fn()

	const mockHandleLogoutClick = vi.fn()

	beforeEach(() => {
		// Default hook return values
		vi.mocked(useMainNavState).mockReturnValue({
			travellerName: mockTravellerName,
			setTravellerName: mockSetTravellerName,
			totalMessages: mockTotalMessages,
			setTotalMessages: mockSetTotalMessages,
			isMenuOpen: false,
			setIsMenuOpen: mockSetIsMenuOpen,
		})

		vi.mocked(useClickOutsideToClose).mockReturnValue(undefined)
		vi.mocked(useMobileMenu).mockReturnValue(undefined)
		vi.mocked(useLogout).mockReturnValue(mockHandleLogoutClick)
	})

	const defaultProps = {
		isLoggedIn: true,
	}

	describe('Rendering tests', () => {
		it('should not render MainNav when isLoggedIn is false', () => {
			render(<MainNav isLoggedIn={false} />)

			expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
		})

		it('should call default hooks with correct parameters', () => {
			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(useMainNavState)).toHaveBeenCalledTimes(1)
			expect(vi.mocked(useClickOutsideToClose)).toHaveBeenCalledWith(
				false,
				expect.any(Object),
				expect.any(Object),
				mockSetIsMenuOpen,
			)
			expect(vi.mocked(useMobileMenu)).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
				mockSetIsMenuOpen,
				true,
			)
			expect(vi.mocked(useLogout)).toHaveBeenCalledWith(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			)
		})

		it('should render NavMenuMessagesLink with correct props', () => {
			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuMessagesLink)).toHaveBeenCalledWith(
				{
					isLink: true,
					className: navMenuButtonLinkStyles.navMenuButtonLink,
					to: PATHS.MESSAGES,
					onMenuItemClick: expect.any(Function),
					'data-cy': 'nav-menu-item-messages',
					totalMessages: mockTotalMessages,
				},
				undefined,
			)
		})

		it('should render Travellers NavMenuButtonLink with correct props', () => {
			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuButtonLink)).toHaveBeenCalledWith(
				{
					isLink: true,
					to: PATHS.TRAVELLERS,
					onMenuItemClick: expect.any(Function),
					className: navMenuButtonLinkStyles.navMenuButtonLink,
					children: 'Travellers',
				},
				undefined,
			)
		})

		it('should render Logout NavMenuButtonLink with correct props', () => {
			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuButtonLink)).toHaveBeenCalledWith(
				expect.objectContaining({
					isLink: true,
					to: PATHS.AUTHENTICATION,
					className: navMenuButtonLinkStyles.navMenuButtonLink,
					'data-cy': 'nav-menu-item-logout',
					onClick: mockHandleLogoutClick,
					children: ['Logout ', mockTravellerName],
				}),
				undefined,
			)
		})
	})
})
