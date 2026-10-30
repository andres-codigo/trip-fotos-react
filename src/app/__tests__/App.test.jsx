import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import * as redux from 'react-redux'
import * as router from 'react-router-dom'

import {
	AUTHENTICATION_ACTION_TYPES,
	TRAVELLERS_ACTION_TYPES,
} from '@/constants/redux'
import { PATHS } from '@/constants/ui'

import App from '@/app/App'

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

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

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
		TRAVELLER_DETAIL: '/travellers/:id',
		CONTACT_TRAVELLER: '/travellers/:id/contact',
		REGISTER: '/register',
		MESSAGES: '/messages',
		PRIVACY: '/privacy',
		PAGE_NOT_FOUND: '/404',
	},
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	tryLogin: () => ({
		type: AUTHENTICATION_ACTION_TYPES.TRY_LOGIN_ASYNC.PENDING,
	}),
	selectUserId: (state) => state.authentication.userId,
}))

vi.mock('@/store/slices/travellersSlice', () => ({
	checkIsTraveller: (userId) => ({
		type: TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER_ASYNC.PENDING,
		meta: { arg: userId },
	}),
}))

vi.mock('@/components/common/LoadingFallback', () => ({
	default: () => <div>Loading...</div>,
}))

vi.mock('@/components/layout/skip-link/SkipLink', () => ({
	default: () => <div>SkipLink</div>,
}))
vi.mock('@/components/layout/header/Header', () => ({
	default: () => <div>Header</div>,
}))
vi.mock('@/components/layout/footer/Footer', () => ({
	default: () => <div>Footer</div>,
}))
vi.mock('@/pages/authentication/Authentication', () => ({
	default: () => <div>UserAuthPage</div>,
}))
vi.mock('@/pages/travellers/Travellers', () => ({
	default: () => <div>TravellersPage</div>,
}))
vi.mock('@/pages/traveller-detail/TravellerDetail', () => ({
	default: () => <div>TravellerDetailPage</div>,
}))
vi.mock('@/pages/contact-traveller/ContactTraveller', () => ({
	default: () => <div>ContactTravellerPage</div>,
}))
vi.mock('@/pages/messages/Messages', () => ({
	default: () => <div>MessagesPage</div>,
}))
vi.mock('@/pages/privacy/Privacy', () => ({
	default: () => <div>PrivacyPage</div>,
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

	function setAuthState(token = null, didAutoLogout = false, userId = null) {
		useSelectorMock.mockImplementation((fn) =>
			fn({ authentication: { token, didAutoLogout, userId } }),
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

			expect(screen.getByText('SkipLink')).toBeInTheDocument()
			expect(screen.getByText('Header')).toBeInTheDocument()
			expect(screen.getByText('Footer')).toBeInTheDocument()
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

		it('renders PrivacyPage without redirecting when not logged in', async () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.PRIVACY,
			})

			renderWithRoute(PATHS.PRIVACY)

			expect(navigateMock).not.toHaveBeenCalled()
			await waitFor(() => {
				expect(screen.getByText('PrivacyPage')).toBeInTheDocument()
			})
		})

		it('renders a canonical link for the current route', () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(
				document.head.querySelector('link[rel="canonical"]'),
			).toHaveAttribute(
				'href',
				window.location.origin + PATHS.AUTHENTICATION,
			)
		})

		it('omits the canonical link on the not found page', () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.PAGE_NOT_FOUND,
			})

			renderWithRoute(PATHS.PAGE_NOT_FOUND)

			expect(
				document.head.querySelector('link[rel="canonical"]'),
			).toBeNull()
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

		it('redirects to /authentication if not logged in and on a traveller detail route', async () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123',
			})

			renderWithRoute('/travellers/abc123')

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					PATHS.AUTHENTICATION,
					{
						replace: true,
					},
				)
			})
		})

		it('renders TravellerDetailPage when logged in and on a traveller detail route', async () => {
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123',
			})

			renderWithRoute('/travellers/abc123')

			await waitFor(() => {
				expect(
					screen.getByText('TravellerDetailPage'),
				).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('redirects to /authentication if not logged in and on a contact traveller route', async () => {
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/contact',
			})

			renderWithRoute('/travellers/abc123/contact')

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					PATHS.AUTHENTICATION,
					{
						replace: true,
					},
				)
			})
		})

		it('renders ContactTravellerPage when logged in and on a contact traveller route', async () => {
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/contact',
			})

			renderWithRoute('/travellers/abc123/contact')

			await waitFor(() => {
				expect(
					screen.getByText('ContactTravellerPage'),
				).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
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

		it('keeps a restored session on the protected URL it was opened at', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState('restored-token', false, 'user-1')

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('sends the user to /authentication when tryLogin finds no session on a protected URL', async () => {
			const dispatch = vi.fn().mockResolvedValue({
				type: AUTHENTICATION_ACTION_TYPES.TRY_LOGIN_ASYNC.REJECTED,
				meta: { rejectedWithValue: true },
			})
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState(null, false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					PATHS.AUTHENTICATION,
					{ replace: true },
				)
			})
		})

		it('redirects a logged-in user from /authentication to the travellers list', async () => {
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
				search: '',
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(PATHS.TRAVELLERS, {
					replace: true,
				})
			})
		})

		it('sends a logged-in user on /authentication to the redirect target when there is one', async () => {
			setAuthState('token', false)

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
				search: '?redirect=/messages',
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith('/messages', {
					replace: true,
				})
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

		it('checks traveller registration when a user is signed in', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState('token', false, 'user-1')

			renderWithRoute(PATHS.HOME)

			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER_ASYNC
						.PENDING,
					meta: { arg: 'user-1' },
				})
			})
		})

		it('does not check traveller registration when signed out', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState(null, false, null)

			renderWithRoute(PATHS.PRIVACY)

			await waitFor(() => {
				expect(dispatch).toHaveBeenCalled()
			})
			expect(dispatch).not.toHaveBeenCalledWith(
				expect.objectContaining({
					type: TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER_ASYNC
						.PENDING,
				}),
			)
		})
	})
})
