import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

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
 * - Active Class: Tests that active class is applied when location matches path
 * - Accessibility: N/A (covered in MainNav.cy.jsx)
 *
 * Note: User interactions, DOM events, and accessibility are covered in MainNav.cy.jsx
 */

const mockUseLocation = vi.fn()

vi.mock('react-router-dom', () => ({
	useLocation: () => mockUseLocation(),
}))

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
import mainNavStyles from '../MainNav.module.scss'

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
		// Default location mock
		mockUseLocation.mockReturnValue({
			pathname: '/current-path',
		})

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

	describe('Behaviour tests', () => {
		it('should call setIsMenuOpen with false when handleMenuItemClick is invoked', () => {
			render(<MainNav {...defaultProps} />)

			const messagesLinkCall =
				vi.mocked(NavMenuMessagesLink).mock.calls[0][0]
			const handleMenuItemClick = messagesLinkCall.onMenuItemClick

			handleMenuItemClick()

			expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
		})

		it('should call setIsMenuOpen with false when Travellers menu item is clicked', () => {
			render(<MainNav {...defaultProps} />)

			const travellersLinkCall = vi
				.mocked(NavMenuButtonLink)
				.mock.calls.find((call) => call[0].children === 'Travellers')
			const handleMenuItemClick = travellersLinkCall[0].onMenuItemClick

			handleMenuItemClick()

			expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
		})

		it('should pass handleMenuItemClick to both navigation menu items', () => {
			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuMessagesLink)).toHaveBeenCalledWith(
				expect.objectContaining({
					onMenuItemClick: expect.any(Function),
				}),
				undefined,
			)

			const travellersCall = vi
				.mocked(NavMenuButtonLink)
				.mock.calls.find((call) => call[0].children === 'Travellers')
			expect(travellersCall[0]).toEqual(
				expect.objectContaining({
					onMenuItemClick: expect.any(Function),
				}),
			)
		})

		it('should apply active class to Messages link when location matches PATHS.MESSAGES', () => {
			mockUseLocation.mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuMessagesLink)).toHaveBeenCalledWith(
				expect.objectContaining({
					className: `${navMenuButtonLinkStyles.navMenuButtonLink} ${mainNavStyles.active}`,
				}),
				undefined,
			)
		})

		it('should not apply active class to Messages link when location does not match PATHS.MESSAGES', () => {
			mockUseLocation.mockReturnValue({
				pathname: '/other-path',
			})

			render(<MainNav {...defaultProps} />)

			expect(vi.mocked(NavMenuMessagesLink)).toHaveBeenCalledWith(
				expect.objectContaining({
					className: navMenuButtonLinkStyles.navMenuButtonLink,
				}),
				undefined,
			)
		})

		it('should apply active class to Travellers link when location matches PATHS.TRAVELLERS', () => {
			mockUseLocation.mockReturnValue({
				pathname: PATHS.TRAVELLERS,
			})

			render(<MainNav {...defaultProps} />)

			const travellersCall = vi
				.mocked(NavMenuButtonLink)
				.mock.calls.find((call) => call[0].children === 'Travellers')

			expect(travellersCall[0]).toEqual(
				expect.objectContaining({
					className: `${navMenuButtonLinkStyles.navMenuButtonLink} ${mainNavStyles.active}`,
				}),
			)
		})

		it('should not apply active class to Travellers link when location does not match PATHS.TRAVELLERS', () => {
			mockUseLocation.mockReturnValue({
				pathname: '/other-path',
			})

			render(<MainNav {...defaultProps} />)

			const travellersCall = vi
				.mocked(NavMenuButtonLink)
				.mock.calls.find((call) => call[0].children === 'Travellers')

			expect(travellersCall[0]).toEqual(
				expect.objectContaining({
					className: navMenuButtonLinkStyles.navMenuButtonLink,
				}),
			)
		})
	})

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
					className: navMenuButtonLinkStyles.navMenuButtonLink,
					to: PATHS.TRAVELLERS,
					onMenuItemClick: expect.any(Function),
					'data-cy': 'nav-menu-item-travellers',
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

	describe('Accessibility tests', () => {
		it('should set correct aria-label and aria-expanded when menu is closed', () => {
			render(<MainNav {...defaultProps} />)

			const hamburgerButton = screen.getByTestId('hamburger-menu')
			expect(hamburgerButton).toHaveAttribute(
				'aria-label',
				'Open navigation menu',
			)
			expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
		})

		it('should set correct aria-label and aria-expanded when menu is open', () => {
			vi.mocked(useMainNavState).mockReturnValueOnce({
				...vi.mocked(useMainNavState).getMockImplementation()(),
				isMenuOpen: true,
			})

			render(<MainNav {...defaultProps} />)

			const hamburgerButton = screen.getByTestId('hamburger-menu')
			expect(hamburgerButton).toHaveAttribute(
				'aria-label',
				'Close navigation menu',
			)
			expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')
		})

		it('should set aria-controls attribute on hamburger button', () => {
			render(<MainNav {...defaultProps} />)

			const hamburgerButton = screen.getByTestId('hamburger-menu')
			expect(hamburgerButton).toHaveAttribute(
				'aria-controls',
				'hamburger-menu-items-container',
			)
		})
	})
})
