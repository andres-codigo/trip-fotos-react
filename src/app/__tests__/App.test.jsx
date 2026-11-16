import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'

import * as redux from 'react-redux'
import * as router from 'react-router-dom'

import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import { PATHS } from '@/constants/ui'

import App from '@/app/App'

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
		AUTH_ACTION: '/auth/action',
		TRAVELLERS: '/travellers',
		TRAVELLER_DETAIL: '/travellers/:id',
		CONTACT_TRAVELLER: '/travellers/:id/contact',
		EDIT_TRAVELLER: '/travellers/:id/edit',
		REGISTER: '/register',
		MESSAGES: '/messages',
		MESSAGE_THREAD: '/messages/:conversationId',
		PRIVACY: '/privacy',
		PAGE_NOT_FOUND: '/404',
	},
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	watchSession: () => ({ type: 'authentication/watchSession' }),
	authActions: {
		clearAwaitingVerification: () => ({
			type: 'authentication/clearAwaitingVerification',
		}),
	},
	selectUserId: (state) => state.authentication.userId,
	selectIsAuthenticated: (state) => Boolean(state.authentication.userId),
	selectSessionChecked: (state) => state.authentication.sessionChecked,
	selectAwaitingVerification: (state) =>
		state.authentication.awaitingVerification,
	selectEmailVerified: (state) => state.authentication.emailVerified,
}))

vi.mock('@/store/slices/travellersSlice', () => ({
	checkIsTraveller: (userId) => ({
		type: TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER_ASYNC.PENDING,
		meta: { arg: userId },
	}),
}))

vi.mock('@/components/common/loading-fallback/LoadingFallback', () => ({
	default: () => <div>Loading...</div>,
}))

vi.mock(
	'@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton',
	() => ({ default: () => <div>TravellersPageSkeleton</div> }),
)
vi.mock(
	'@/components/messages/messages-page-skeleton/MessagesPageSkeleton',
	() => ({ default: () => <div>MessagesPageSkeleton</div> }),
)

vi.mock('@/components/layout/skip-link/SkipLink', () => ({
	default: () => <div>SkipLink</div>,
}))
vi.mock('@/components/layout/header/Header', () => ({
	default: () => <div>Header</div>,
}))
vi.mock('@/components/layout/tab-bar/TabBar', () => ({
	default: ({ className }) => <div data-class={className}>TabBar</div>,
}))
vi.mock('@/components/layout/footer/Footer', () => ({
	default: ({ className }) => <div data-class={className}>Footer</div>,
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
vi.mock('@/pages/edit-trip/EditTrip', () => ({
	default: () => <div>EditTripPage</div>,
}))
vi.mock('@/pages/messages/Messages', () => ({
	default: () => <div>MessagesPage</div>,
}))
vi.mock('@/pages/auth-action/AuthAction', () => ({
	default: () => <div>AuthActionPage</div>,
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

	let authState

	function setAuthState({
		userId = null,
		awaitingVerification = false,
		emailVerified = true,
		sessionChecked = true,
	} = {}) {
		authState = {
			userId,
			awaitingVerification,
			emailVerified,
			sessionChecked,
		}
		useSelectorMock.mockImplementation((fn) =>
			fn({ authentication: authState }),
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

	// The page's code is still downloading on the first render, so the boundary's fallback shows
	describe('Route fallbacks', () => {
		it.each([
			[PATHS.TRAVELLERS, 'TravellersPageSkeleton', 'TravellersPage'],
			[PATHS.MESSAGES, 'MessagesPageSkeleton', 'MessagesPage'],
		])(
			'shows the page skeleton, not the spinner, while %s loads',
			async (path, skeleton, page) => {
				setAuthState({ userId: 'user-1' })
				vi.spyOn(router, 'useLocation').mockReturnValue({
					pathname: path,
				})

				renderWithRoute(path)

				expect(screen.getByText(skeleton)).toBeInTheDocument()
				expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
				await waitFor(() => {
					expect(screen.getByText(page)).toBeInTheDocument()
				})
			},
		)

		it('keeps the spinner for the other routes', async () => {
			setAuthState()
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.PRIVACY,
			})

			renderWithRoute(PATHS.PRIVACY)

			expect(screen.getByText('Loading...')).toBeInTheDocument()
			await waitFor(() => {
				expect(screen.getByText('PrivacyPage')).toBeInTheDocument()
			})
		})
	})

	describe('Prefetching the nav pages', () => {
		afterEach(() => {
			delete window.requestIdleCallback
			delete window.cancelIdleCallback
		})

		it('waits for the browser to be idle and stops waiting on unmount', async () => {
			window.requestIdleCallback = vi.fn(() => 7)
			window.cancelIdleCallback = vi.fn()
			setAuthState()

			const { unmount } = renderWithRoute(PATHS.PRIVACY)

			expect(window.requestIdleCallback).toHaveBeenCalledTimes(1)
			await act(async () => {
				window.requestIdleCallback.mock.calls[0][0]()
			})
			await waitFor(() => {
				expect(screen.getByText('PrivacyPage')).toBeInTheDocument()
			})
			unmount()
			expect(window.cancelIdleCallback).toHaveBeenCalledWith(7)
		})

		it('falls back to a timeout where the browser has no idle callback', async () => {
			const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
			setAuthState()

			renderWithRoute(PATHS.PRIVACY)

			expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0)
			await waitFor(() => {
				expect(screen.getByText('PrivacyPage')).toBeInTheDocument()
			})
		})
	})

	describe('Rendering tests', () => {
		it('renders Header and TravellersPage when logged in and on /home', async () => {
			setAuthState({ userId: 'user-1' })

			renderWithRoute(PATHS.HOME)

			expect(screen.getByText('SkipLink')).toBeInTheDocument()
			expect(screen.getByText('Header')).toBeInTheDocument()
			expect(screen.getByText('Footer')).toBeInTheDocument()
			// Last in the page, so the tab bar comes last in tab order too
			expect(
				screen
					.getByText('Footer')
					.compareDocumentPosition(screen.getByText('TabBar')) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy()
			await waitFor(() => {
				expect(screen.getByText('TravellersPage')).toBeInTheDocument()
			})
		})

		it('does not redirect if not logged in and on public route', async () => {
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(navigateMock).not.toHaveBeenCalled()
			await waitFor(() => {
				expect(screen.getByText('UserAuthPage')).toBeInTheDocument()
			})
		})

		it('moves a signed-in user off the login page', () => {
			setAuthState({ userId: 'u1' })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
				search: '',
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(navigateMock).toHaveBeenCalledWith(PATHS.TRAVELLERS, {
				replace: true,
			})
		})

		it('keeps a new account on the login page while it shows Check your inbox', () => {
			setAuthState({ userId: 'u1', awaitingVerification: true })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
				search: '',
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('keeps an unverified account on the login page after a reload, for Check your inbox', () => {
			setAuthState({ userId: 'u1', emailVerified: false })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
				search: '',
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('opens the email-link page without signing in', async () => {
			setAuthState()
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTH_ACTION,
			})

			renderWithRoute(PATHS.AUTH_ACTION)

			expect(navigateMock).not.toHaveBeenCalled()
			expect(
				await screen.findByText('AuthActionPage'),
			).toBeInTheDocument()
		})

		it('renders PrivacyPage without redirecting when not logged in', async () => {
			setAuthState()

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
			setAuthState()

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
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.PAGE_NOT_FOUND,
			})

			renderWithRoute(PATHS.PAGE_NOT_FOUND)

			expect(
				document.head.querySelector('link[rel="canonical"]'),
			).toBeNull()
		})

		it('renders NotFoundPage for unknown route', async () => {
			setAuthState({ userId: 'user-1' })

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
		// The flag is persisted, so a new tab from the verification email's Continue button starts with it set
		it.each([PATHS.MESSAGES, PATHS.TRAVELLERS])(
			'clears Check your inbox on %s',
			async (pathname) => {
				const dispatch = vi.fn()
				useDispatchMock.mockReturnValue(dispatch)
				setAuthState({ userId: 'user-1', awaitingVerification: true })
				vi.spyOn(router, 'useLocation').mockReturnValue({ pathname })

				renderWithRoute(pathname)

				await waitFor(() =>
					expect(dispatch).toHaveBeenCalledWith({
						type: 'authentication/clearAwaitingVerification',
					}),
				)
			},
		)

		it('keeps Check your inbox on the login page', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState({ userId: 'user-1', awaitingVerification: true })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTHENTICATION,
			})

			renderWithRoute(PATHS.AUTHENTICATION)

			await waitFor(() => expect(dispatch).toHaveBeenCalled())
			expect(dispatch).not.toHaveBeenCalledWith({
				type: 'authentication/clearAwaitingVerification',
			})
		})

		it('redirects to /authentication if not logged in and on protected route', async () => {
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.REGISTER,
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)

			renderWithRoute(PATHS.REGISTER)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(PATHS.REGISTER)}`,
					{ replace: true },
				)
			})
		})

		it.each([PATHS.HOME, PATHS.TRAVELLERS])(
			'lets a logged-out visitor stay on %s',
			async (pathname) => {
				setAuthState()
				vi.spyOn(router, 'useLocation').mockReturnValue({ pathname })

				renderWithRoute(pathname)

				await waitFor(() => {
					expect(navigateMock).not.toHaveBeenCalledWith(
						expect.stringContaining(PATHS.AUTHENTICATION),
						expect.anything(),
					)
				})
			},
		)

		it('redirects to /authentication if not logged in and on a traveller detail route', async () => {
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123',
			})

			renderWithRoute('/travellers/abc123')

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent('/travellers/abc123')}`,
					{ replace: true },
				)
			})
		})

		it('renders TravellerDetailPage when logged in and on a traveller detail route', async () => {
			setAuthState({ userId: 'user-1' })

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
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/contact',
			})

			renderWithRoute('/travellers/abc123/contact')

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent('/travellers/abc123/contact')}`,
					{ replace: true },
				)
			})
		})

		it('sends a contact link to the conversation with that traveller', async () => {
			useDispatchMock.mockReturnValue(vi.fn())
			setAuthState({ userId: 'user-1' })

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/contact',
			})

			renderWithRoute('/travellers/abc123/contact')

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
		})

		it('hides the tab bar and footer below 1024px on a thread', async () => {
			useDispatchMock.mockReturnValue(vi.fn())
			setAuthState({ userId: 'user-1' })

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/messages/abc123_user-1',
			})

			renderWithRoute('/messages/abc123_user-1')

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(screen.getByText('TabBar')).toHaveAttribute(
				'data-class',
				'mobile:hidden',
			)
			expect(screen.getByText('Footer')).toHaveAttribute(
				'data-class',
				'max-lg:hidden',
			)
		})

		it('redirects to /authentication if not logged in and on an edit trip route', async () => {
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/edit',
			})

			renderWithRoute('/travellers/abc123/edit')

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent('/travellers/abc123/edit')}`,
					{ replace: true },
				)
			})
		})

		it('renders EditTripPage when logged in and on an edit trip route', async () => {
			setAuthState({ userId: 'user-1' })

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: '/travellers/abc123/edit',
			})

			renderWithRoute('/travellers/abc123/edit')

			await waitFor(() => {
				expect(screen.getByText('EditTripPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('sends the traveller to /authentication when the session ends on a public page', async () => {
			setAuthState({ userId: 'user-1' })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.TRAVELLERS,
			})

			const { rerender } = renderWithRoute(PATHS.TRAVELLERS)
			expect(navigateMock).not.toHaveBeenCalled()

			setAuthState()
			rerender(
				<router.MemoryRouter initialEntries={[PATHS.TRAVELLERS]}>
					<App />
				</router.MemoryRouter>,
			)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(PATHS.AUTHENTICATION)
			})
		})

		it('does not send a visitor who was never signed in to /authentication', async () => {
			setAuthState()
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.TRAVELLERS,
			})

			renderWithRoute(PATHS.TRAVELLERS)

			await waitFor(() => {
				expect(screen.getByText('TravellersPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('opens a protected page from the saved session at once, redirecting nowhere while the SDK confirms it', async () => {
			setAuthState({ userId: 'user-1', sessionChecked: false })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('waits for the SDK before sending a visitor from a protected page to log in', async () => {
			setAuthState({ sessionChecked: false })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('keeps a restored session on the protected URL it was opened at', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState({ userId: 'user-1' })

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('sends the user to /authentication when the SDK has no saved session on a protected URL', async () => {
			setAuthState()

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.MESSAGES,
			})

			renderWithRoute(PATHS.MESSAGES)

			await waitFor(() => {
				expect(navigateMock).toHaveBeenCalledWith(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(PATHS.MESSAGES)}`,
					{ replace: true },
				)
			})
		})

		it('redirects a logged-in user from /authentication to the travellers list', async () => {
			setAuthState({ userId: 'user-1' })

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
			setAuthState({ userId: 'user-1' })

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

		it('starts the session listener on mount', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState({ userId: 'user-1' })

			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.HOME,
			})
			vi.spyOn(router, 'useInRouterContext').mockReturnValue(true)

			renderWithRoute(PATHS.HOME)

			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: 'authentication/watchSession',
				})
			})
		})

		it('checks traveller registration when a user is signed in', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState({ userId: 'user-1' })

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
			setAuthState()

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
