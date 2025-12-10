import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import * as redux from 'react-redux'
import * as router from 'react-router-dom'

import { AUTHENTICATION_ACTION_TYPES } from '@/constants/redux'
import { PATHS } from '@/constants/ui'

import App from '../App'

/**
 * App Component Unit Tests
 *
 * Tests the main application component including routing, authentication, and navigation logic.
 *
 * Mocks:
 * - react-redux: useDispatch and useSelector for Redux state management
 * - react-router-dom: Router hooks (useNavigate, useLocation, useInRouterContext)
 * - All page components: Simplified versions returning identifying text
 * - Layout components: Header and LoadingFallback simplified for testing
 * - Authentication slice: tryLogin action mocked
 * - UI constants: PATHS object with route definitions
 *
 * Router: Uses MemoryRouter to test routing behavior without browser dependency
 *
 * Test Coverage:
 * - Rendering: Correct page display based on route and auth state
 * - Navigation: Redirects for protected routes and auto-logout scenarios
 * - Authentication: Token validation, auto-login attempt on mount
 * - Authorisation: Public vs protected route access control
 */

vi.mock('react-redux', () => ({
	useDispatch: () => vi.fn(),
	useSelector: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom')
	return {
		...actual,
		useNavigate: () => vi.fn(),
		useLocation: () => ({ pathname: PATHS.HOME }),
		useInRouterContext: () => false,
	}
})

vi.mock('@/constants/ui', () => ({
	PATHS: {
		HOME: '/home',
		AUTHENTICATION: '/authentication',
		TRAVELLERS: '/travellers',
		MESSAGES: '/messages',
		PAGENOTFOUND: '/404',
	},
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	tryLogin: () => ({
		type: AUTHENTICATION_ACTION_TYPES.TRY_LOGIN_ASYNC.PENDING,
	}),
}))

vi.mock('@/components/common/LoadingFallback', () => ({
	default: () => <div>Loading...</div>,
}))

vi.mock('@/components/layout/header/Header', () => ({
	default: () => <div>Header</div>,
}))
vi.mock('@/pages/authentication/Authentication', () => ({
	default: () => <div>UserAuthPage</div>,
}))
vi.mock('@/pages/home/Home', () => ({
	default: () => <div>HomePage</div>,
}))
vi.mock('@/pages/travellers/Travellers', () => ({
	default: () => <div>TravellersPage</div>,
}))
vi.mock('@/pages/messages/Messages', () => ({
	default: () => <div>MessagesPage</div>,
}))
vi.mock('@/pages/page-not-found/PageNotFound', () => ({
	default: () => <div>NotFoundPage</div>,
}))

function renderWithRoute(route) {
	return render(
		<router.MemoryRouter initialEntries={[route]}>
			<App />
		</router.MemoryRouter>,
	)
}

describe('App', () => {
	let useSelectorMock
	let useDispatchMock
	let navigateMock

	function setAuthState(token = null, didAutoLogout = false) {
		useSelectorMock.mockImplementation((fn) =>
			fn({ authentication: { token, didAutoLogout } }),
		)
	}

	beforeEach(() => {
		useSelectorMock = vi.spyOn(redux, 'useSelector')
		useDispatchMock = vi.spyOn(redux, 'useDispatch')
		navigateMock = vi.fn()
		vi.spyOn(router, 'useNavigate').mockReturnValue(navigateMock)
		vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('Rendering tests', () => {
		it('renders Header and TravellersPage when logged in and on /home', async () => {
			setAuthState('token', false)

			renderWithRoute(PATHS.HOME)

			expect(screen.getByText('Header')).toBeInTheDocument()
			await waitFor(() => {
				expect(screen.getByText('TravellersPage')).toBeInTheDocument()
			})
		})

		it('does not redirect if not logged in and on public route', async () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(navigateMock).not.toHaveBeenCalled()
			await waitFor(() => {
				expect(screen.getByText('UserAuthPage')).toBeInTheDocument()
			})
		})

		it('renders NotFoundPage for unknown route', async () => {
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/unknown',
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(false)

			render(<App />)
			await waitFor(() => {
				expect(screen.getByText('NotFoundPage')).toBeInTheDocument()
			})
		})
	})

	describe('Behaviour tests', () => {
		it('redirects to /authentication if not logged in and on protected route', async () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.HOME,
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)

			renderWithRoute(PATHS.HOME)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					PATHS.AUTHENTICATION,
					{
						replace: true,
					},
				)
			})
		})

		it('redirects to /authentication on auto logout', async () => {
			setAuthState('token', true)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.HOME,
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)

			renderWithRoute(PATHS.HOME)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(PATHS.AUTHENTICATION)
			})
		})

		it('dispatches tryLogin on mount', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.HOME,
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)

			renderWithRoute(PATHS.HOME)

			await waitFor(() => {
				expect(dispatch).toHaveBeenCalled()
			})
		})
	})
})
