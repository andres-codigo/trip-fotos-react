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
		ACCOUNT: '/account',
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
vi.mock('@/components/layout/verify-email-strip/VerifyEmailStrip', () => ({
	default: () => <div>VerifyEmailStrip</div>,
}))
vi.mock('@/components/layout/tab-bar/TabBar', () => ({
	default: () => <div>TabBar</div>,
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
vi.mock('@/pages/register/Register', () => ({
	default: () => <div>RegisterPage</div>,
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
vi.mock('@/pages/account/Account', () => ({
	default: () => <div>AccountPage</div>,
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

const renderAt = (pathname, search = '') => {
	vi.spyOn(router, 'useLocation').mockReturnValue({ pathname, search })
	return renderWithRoute(pathname)
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

	describe('Verify email strip', () => {
		it.each([PATHS.TRAVELLERS, PATHS.MESSAGES, '/travellers/u1'])(
			'shows under the header for an unverified signed-in user on %s',
			(path) => {
				setAuthState({ userId: 'u1', emailVerified: false })

				renderAt(path)

				expect(
					screen
						.getByText('Header')
						.compareDocumentPosition(
							screen.getByText('VerifyEmailStrip'),
						) & Node.DOCUMENT_POSITION_FOLLOWING,
				).toBeTruthy()
			},
		)

		it.each([
			PATHS.REGISTER,
			'/travellers/u1/edit',
			'/messages/u1_u2',
			PATHS.AUTH_ACTION,
			PATHS.AUTHENTICATION,
			PATHS.ACCOUNT,
		])('leaves it to the page on %s', (path) => {
			setAuthState({ userId: 'u1', emailVerified: false })

			renderAt(path)

			expect(
				screen.queryByText('VerifyEmailStrip'),
			).not.toBeInTheDocument()
		})

		it('does not show once verified, signed out or on Check your inbox', () => {
			setAuthState({ userId: 'u1' })
			const { unmount } = renderAt(PATHS.TRAVELLERS)
			expect(
				screen.queryByText('VerifyEmailStrip'),
			).not.toBeInTheDocument()
			unmount()

			setAuthState({ emailVerified: false })
			renderAt(PATHS.TRAVELLERS).unmount()
			expect(
				screen.queryByText('VerifyEmailStrip'),
			).not.toBeInTheDocument()

			setAuthState({
				userId: 'u1',
				emailVerified: false,
				awaitingVerification: true,
			})
			renderAt(PATHS.TRAVELLERS)
			expect(
				screen.queryByText('VerifyEmailStrip'),
			).not.toBeInTheDocument()
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

		it.each([
			[PATHS.AUTHENTICATION, 'UserAuthPage'],
			[PATHS.AUTH_ACTION, 'AuthActionPage'],
			[PATHS.PRIVACY, 'PrivacyPage'],
			[PATHS.HOME, 'TravellersPage'],
			[PATHS.TRAVELLERS, 'TravellersPage'],
		])(
			'lets a logged-out visitor open %s without redirecting',
			async (path, page) => {
				setAuthState()

				renderAt(path)

				expect(await screen.findByText(page)).toBeInTheDocument()
				expect(navigateMock).not.toHaveBeenCalled()
			},
		)

		it.each([
			[
				'a new account showing Check your inbox',
				{ awaitingVerification: true },
			],
			['an unverified account after a reload', { emailVerified: false }],
		])('keeps %s on the login page', (_, state) => {
			setAuthState({ userId: 'u1', ...state })

			renderAt(PATHS.AUTHENTICATION)

			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('renders a canonical link for the current route', () => {
			setAuthState()

			renderAt(PATHS.AUTHENTICATION)

			expect(
				document.head.querySelector('link[rel="canonical"]'),
			).toHaveAttribute(
				'href',
				window.location.origin + PATHS.AUTHENTICATION,
			)
		})

		it('omits the canonical link on the not found page', () => {
			setAuthState()

			renderAt(PATHS.PAGE_NOT_FOUND)

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

				renderAt(pathname)

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

			renderAt(PATHS.AUTHENTICATION)

			await waitFor(() => expect(dispatch).toHaveBeenCalled())
			expect(dispatch).not.toHaveBeenCalledWith({
				type: 'authentication/clearAwaitingVerification',
			})
		})

		it.each([
			PATHS.REGISTER,
			'/travellers/abc123',
			'/travellers/abc123/contact',
			'/travellers/abc123/edit',
			PATHS.MESSAGES,
		])(
			'redirects a logged-out visitor on %s to log in, then back',
			async (path) => {
				setAuthState()

				renderAt(path)

				await waitFor(() => {
					expect(navigateMock).toHaveBeenCalledWith(
						`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(path)}`,
						{ replace: true },
					)
				})
			},
		)

		it.each([
			['/travellers/abc123', 'TravellerDetailPage', {}],
			// A contact link opens the conversation with that traveller
			['/travellers/abc123/contact', 'MessagesPage', {}],
			['/travellers/abc123/edit', 'EditTripPage', {}],
			[PATHS.MESSAGES, 'MessagesPage', {}],
			// The saved session opens the page at once, while the SDK confirms it
			[PATHS.MESSAGES, 'MessagesPage', { sessionChecked: false }],
		])(
			'opens %s as %s for a signed-in user %o, redirecting nowhere',
			async (path, page, state) => {
				useDispatchMock.mockReturnValue(vi.fn())
				setAuthState({ userId: 'user-1', ...state })

				renderAt(path)

				expect(await screen.findByText(page)).toBeInTheDocument()
				expect(navigateMock).not.toHaveBeenCalled()
			},
		)

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

		// The action page signs out itself after an email change and offers its own Log in
		it('keeps the email-link page when its link ends the session', async () => {
			setAuthState({ userId: 'user-1' })
			vi.spyOn(router, 'useLocation').mockReturnValue({
				pathname: PATHS.AUTH_ACTION,
			})

			const { rerender } = renderWithRoute(PATHS.AUTH_ACTION)

			setAuthState()
			rerender(
				<router.MemoryRouter initialEntries={[PATHS.AUTH_ACTION]}>
					<App />
				</router.MemoryRouter>,
			)

			await waitFor(() => {
				expect(screen.getByText('AuthActionPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('waits for the SDK before sending a visitor from a protected page to log in', async () => {
			setAuthState({ sessionChecked: false })

			renderAt(PATHS.MESSAGES)

			await waitFor(() => {
				expect(screen.getByText('MessagesPage')).toBeInTheDocument()
			})
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it.each([
			['the travellers list', '', PATHS.TRAVELLERS],
			[
				'the redirect target when there is one',
				'?redirect=/messages',
				'/messages',
			],
		])(
			'sends a logged-in user on /authentication to %s',
			async (_, search, target) => {
				setAuthState({ userId: 'user-1' })

				renderAt(PATHS.AUTHENTICATION, search)

				await waitFor(() => {
					expect(navigateMock).toHaveBeenCalledWith(target, {
						replace: true,
					})
				})
			},
		)

		it('starts the session listener on mount', async () => {
			const dispatch = vi.fn()
			useDispatchMock.mockReturnValue(dispatch)
			setAuthState({ userId: 'user-1' })

			renderAt(PATHS.HOME)

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
