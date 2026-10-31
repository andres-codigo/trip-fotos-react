import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDispatch, useSelector } from 'react-redux'

/**
 * MainNav Unit Tests
 *
 * Mocks:
 * - Custom hooks: All navigation-related hooks with controlled return values for state management
 * - NavMenuButtonLink and NavMenuMessagesLink: buttons that surface the props they receive as DOM (aria-current, label, click)
 *
 * Test Coverage:
 * - Rendering: Hook integration, prop forwarding, conditional rendering based on isLoggedIn
 * - Component Integration: What the child links render and do (their own props are covered by their tests)
 * - Hook Parameters: Ensures hooks are called with proper arguments and dependencies
 * - Active link: Tests that isActive is set when location matches path
 * - Accessibility: N/A (covered in MainNav.cy.jsx)
 *
 * Note: User interactions, DOM events, and accessibility are covered in MainNav.cy.jsx
 */

const mockUseLocation = vi.fn()

vi.mock('react-router-dom', () => ({
	useLocation: () => mockUseLocation(),
}))

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

import MainNav from '@/components/layout/main-nav/MainNav'

// Mock custom hooks
vi.mock('@/components/layout/main-nav/hooks/useMainNavState', () => ({
	default: vi.fn(),
}))

vi.mock('@/components/layout/main-nav/hooks/useClickOutsideToClose', () => ({
	default: vi.fn(),
}))

vi.mock('@/components/layout/main-nav/hooks/useLogout', () => ({
	default: vi.fn(),
}))

// Mock child components: they surface what MainNav passes as DOM, so tests assert what is rendered
vi.mock('@/components/layout/main-nav/nav-menu/NavMenuButtonLink', () => ({
	default: ({
		isActive,
		onClick,
		onMenuItemClick,
		'data-cy': dataCy,
		ariaLabel,
		children,
	}) => (
		<button
			type="button"
			aria-label={ariaLabel}
			aria-current={isActive ? 'page' : undefined}
			onClick={onClick || onMenuItemClick}
			data-cy={dataCy}>
			{children}
		</button>
	),
}))

vi.mock('@/components/layout/main-nav/nav-menu/NavMenuMessagesLink', () => ({
	default: ({
		isActive,
		onMenuItemClick,
		'data-cy': dataCy,
		totalMessages,
	}) => (
		<button
			type="button"
			aria-current={isActive ? 'page' : undefined}
			onClick={onMenuItemClick}
			data-cy={dataCy}>
			Messages {totalMessages}
		</button>
	),
}))

import useMainNavState from '@/components/layout/main-nav/hooks/useMainNavState'
import useClickOutsideToClose from '@/components/layout/main-nav/hooks/useClickOutsideToClose'
import useLogout from '@/components/layout/main-nav/hooks/useLogout'

import { PATHS } from '@/constants/ui'

describe('<MainNav />', () => {
	const mockTravellerName = 'John Doe'
	const mockTotalMessages = 5
	const mockMessages = Array.from({ length: mockTotalMessages }, (_, id) => ({
		id,
	}))

	const mockSetTravellerName = vi.fn()
	const mockDispatch = vi.fn()
	const mockSetIsMenuOpen = vi.fn()

	const mockHandleLogoutClick = vi.fn()

	beforeEach(() => {
		// Default location mock
		mockUseLocation.mockReturnValue({
			pathname: '/current-path',
		})

		// Default selector mock
		vi.mocked(useSelector).mockImplementation((selector) =>
			selector({
				travellers: {
					travellerName: mockTravellerName,
					isTraveller: true,
				},
				messages: { messages: mockMessages },
			}),
		)

		// Default hook return values
		vi.mocked(useMainNavState).mockReturnValue({
			travellerName: mockTravellerName,
			setTravellerName: mockSetTravellerName,
			isMenuOpen: false,
			setIsMenuOpen: mockSetIsMenuOpen,
		})

		vi.mocked(useDispatch).mockReturnValue(mockDispatch)
		mockDispatch.mockClear()
		vi.mocked(useClickOutsideToClose).mockReturnValue(undefined)
		vi.mocked(useLogout).mockReturnValue(mockHandleLogoutClick)
	})

	const defaultProps = {
		isLoggedIn: true,
	}

	describe('Behaviour tests', () => {
		it('should sync the store traveller name when logged in', () => {
			render(<MainNav {...defaultProps} />)

			expect(mockSetTravellerName).toHaveBeenCalledWith(mockTravellerName)
		})

		it('should clear the displayed name when the store name is empty', () => {
			vi.mocked(useSelector).mockImplementation((selector) =>
				selector({
					travellers: { travellerName: '', isTraveller: true },
					messages: { messages: [] },
				}),
			)

			render(<MainNav {...defaultProps} />)

			expect(mockSetTravellerName).toHaveBeenCalledWith('')
		})

		it('should load the messages for a logged-in traveller', () => {
			render(<MainNav {...defaultProps} />)

			expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function))
		})

		it.each([
			['logged out', { isLoggedIn: false }],
			['not a traveller', { isLoggedIn: true, isTraveller: false }],
		])('should not load the messages when %s', (_label, props) => {
			render(<MainNav {...props} />)

			expect(mockDispatch).not.toHaveBeenCalled()
		})

		it('should not touch the displayed name when logged out', () => {
			render(
				<MainNav
					{...defaultProps}
					isLoggedIn={false}
				/>,
			)

			expect(mockSetTravellerName).not.toHaveBeenCalled()
		})

		it('should close the menu when the Messages link is clicked', () => {
			render(<MainNav {...defaultProps} />)

			fireEvent.click(screen.getByTestId('nav-menu-item-messages'))

			expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
		})

		it('should close the menu when the Travellers link is clicked', () => {
			render(<MainNav {...defaultProps} />)

			fireEvent.click(screen.getByTestId('nav-menu-item-travellers'))

			expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
		})

		it.each([
			['Messages', 'nav-menu-item-messages', PATHS.MESSAGES],
			['Travellers', 'nav-menu-item-travellers', PATHS.TRAVELLERS],
		])(
			'should mark the %s link as the current page only on its own path',
			(_label, dataCy, path) => {
				mockUseLocation.mockReturnValue({ pathname: path })
				const { unmount } = render(<MainNav {...defaultProps} />)

				expect(screen.getByTestId(dataCy)).toHaveAttribute(
					'aria-current',
					'page',
				)
				unmount()

				mockUseLocation.mockReturnValue({ pathname: '/other-path' })
				render(<MainNav {...defaultProps} />)

				expect(screen.getByTestId(dataCy)).not.toHaveAttribute(
					'aria-current',
				)
			},
		)
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
			expect(vi.mocked(useLogout)).toHaveBeenCalledWith(
				mockSetTravellerName,
				mockSetIsMenuOpen,
			)
		})

		it('should render the Messages link with the message count', () => {
			render(<MainNav {...defaultProps} />)

			expect(
				screen.getByTestId('nav-menu-item-messages'),
			).toHaveTextContent(`Messages ${mockTotalMessages}`)
		})

		it('should not render the Messages link for a non-traveller', () => {
			render(
				<MainNav
					{...defaultProps}
					isTraveller={false}
				/>,
			)

			expect(
				screen.queryByTestId('nav-menu-item-messages'),
			).not.toBeInTheDocument()
		})

		it('should render the Travellers link', () => {
			render(<MainNav {...defaultProps} />)

			expect(
				screen.getByTestId('nav-menu-item-travellers'),
			).toHaveTextContent('Travellers')
		})

		it('should render the Logout link with the traveller name and log out on click', () => {
			render(<MainNav {...defaultProps} />)

			const logout = screen.getByTestId('nav-menu-item-logout')
			expect(logout).toHaveAccessibleName(`Logout ${mockTravellerName}`)

			fireEvent.click(logout)

			expect(mockHandleLogoutClick).toHaveBeenCalledTimes(1)
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
				'nav-menu-items-container',
			)
		})
	})
})
