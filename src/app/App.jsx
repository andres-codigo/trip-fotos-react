import { useEffect, lazy, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
	Routes,
	Route,
	Navigate,
	matchPath,
	useNavigate,
	useLocation,
	BrowserRouter,
	useInRouterContext,
} from 'react-router-dom'

import { PATHS } from '@/constants/ui'

import { selectUserId, tryLogin } from '@/store/slices/authenticationSlice'
import { checkIsTraveller } from '@/store/slices/travellersSlice'

import LoadingFallback from '@/components/common/loading-fallback/LoadingFallback'

import SkipLink from '@/components/layout/skip-link/SkipLink'
import Header from '@/components/layout/header/Header'
import Footer from '@/components/layout/footer/Footer'
import TabBar from '@/components/layout/tab-bar/TabBar'
import MessagesPageSkeleton from '@/components/messages/messages-page-skeleton/MessagesPageSkeleton'
import TravellersPageSkeleton from '@/components/travellers/travellers-page-skeleton/TravellersPageSkeleton'

const loadAuthentication = () => import('@/pages/authentication/Authentication')
const loadRegister = () => import('@/pages/register/Register')
const loadTravellers = () => import('@/pages/travellers/Travellers')
const loadTravellerDetail = () =>
	import('@/pages/traveller-detail/TravellerDetail')
const loadMessages = () => import('@/pages/messages/Messages')

const Authentication = lazy(loadAuthentication)
const Register = lazy(loadRegister)
const Travellers = lazy(loadTravellers)
const TravellerDetail = lazy(loadTravellerDetail)
const ContactTraveller = lazy(
	() => import('@/pages/contact-traveller/ContactTraveller'),
)
const EditTrip = lazy(() => import('@/pages/edit-trip/EditTrip'))
const Messages = lazy(loadMessages)
const Privacy = lazy(() => import('@/pages/privacy/Privacy'))
import PageNotFound from '@/pages/page-not-found/PageNotFound'

// The pages the header and tab bar link to (My trip is the detail page), so a tap on one does not wait for its code
const NAV_PAGES = [
	loadTravellers,
	loadMessages,
	loadTravellerDetail,
	loadRegister,
	loadAuthentication,
]

// Fetched once the browser is idle after the first paint, so the prefetch never competes with the page being opened; a failed fetch is retried by the route itself
const prefetchNavPages = () => {
	const prefetch = () => NAV_PAGES.forEach((load) => load().catch(() => {}))

	if ('requestIdleCallback' in window) {
		const id = window.requestIdleCallback(prefetch)
		return () => window.cancelIdleCallback(id)
	}
	const id = window.setTimeout(prefetch, 0)
	return () => window.clearTimeout(id)
}

function AppRoutes() {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation()

	// Access the `isLoggedIn` and `didAutoLogout` states from the Redux store
	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)
	const didAutoLogout = useSelector(
		(state) => state.authentication.didAutoLogout,
	)
	const userId = useSelector(selectUserId)

	// Dispatch `tryLogin` on component mount
	useEffect(() => {
		dispatch(tryLogin())
	}, [dispatch])

	// Registration lives in the database, not the session, so a new device or cleared storage would otherwise count as a non-traveller
	useEffect(() => {
		if (userId) {
			dispatch(checkIsTraveller(userId))
		}
	}, [userId, dispatch])

	useEffect(prefetchNavPages, [])

	// Watch for changes in `didAutoLogout` and redirect to the login page
	useEffect(() => {
		if (didAutoLogout) {
			navigate(PATHS.AUTHENTICATION)
		}
	}, [didAutoLogout, navigate])

	// A signed-in user has no use for the login form; the login page honours the same redirect target
	useEffect(() => {
		if (isLoggedIn && location.pathname === PATHS.AUTHENTICATION) {
			const redirectUrl =
				new URLSearchParams(location.search).get('redirect') ||
				PATHS.TRAVELLERS
			navigate(redirectUrl, { replace: true })
		}
	}, [isLoggedIn, location.pathname, location.search, navigate])

	// Watch for changes in `isLoggedIn` and redirect to the login page if not logged in
	useEffect(() => {
		const publicPaths = [
			PATHS.HOME,
			PATHS.AUTHENTICATION,
			PATHS.TRAVELLERS,
			PATHS.PRIVACY,
			PATHS.PAGE_NOT_FOUND,
		]
		const isPublic = publicPaths.includes(location.pathname)

		if (!isLoggedIn && !isPublic) {
			// Only redirect if the route is a known protected route
			const protectedPaths = [
				PATHS.REGISTER,
				PATHS.MESSAGES,
				PATHS.TRAVELLER_DETAIL,
				PATHS.CONTACT_TRAVELLER,
				PATHS.EDIT_TRAVELLER,
			]
			if (
				protectedPaths.some((path) =>
					matchPath(path, location.pathname),
				)
			) {
				// Logging in returns the visitor to the page they asked for, such as a trip from the public list
				navigate(
					`${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(location.pathname)}`,
					{ replace: true },
				)
			}
		}
	}, [isLoggedIn, location.pathname, navigate])

	return (
		<>
			{location.pathname !== PATHS.PAGE_NOT_FOUND && (
				<link
					rel="canonical"
					href={window.location.origin + location.pathname}
				/>
			)}
			<SkipLink />
			<Header />
			{/* Travellers and Messages have their own boundary, whose skeleton matches the page; the rest share the spinner */}
			<Suspense fallback={<LoadingFallback />}>
				<Routes>
					<Route
						path={PATHS.HOME}
						element={
							<Navigate
								to={PATHS.TRAVELLERS}
								replace
							/>
						}
					/>
					<Route
						path={PATHS.AUTHENTICATION}
						element={<Authentication />}
					/>
					<Route
						path={PATHS.REGISTER}
						element={<Register />}
					/>
					<Route
						path={PATHS.TRAVELLERS}
						element={
							<Suspense fallback={<TravellersPageSkeleton />}>
								<Travellers />
							</Suspense>
						}
					/>
					<Route
						path={PATHS.TRAVELLER_DETAIL}
						element={<TravellerDetail />}
					/>
					<Route
						path={PATHS.CONTACT_TRAVELLER}
						element={<ContactTraveller />}
					/>
					<Route
						path={PATHS.EDIT_TRAVELLER}
						element={<EditTrip />}
					/>
					<Route
						path={PATHS.MESSAGES}
						element={
							<Suspense fallback={<MessagesPageSkeleton />}>
								<Messages />
							</Suspense>
						}
					/>
					<Route
						path={PATHS.PRIVACY}
						element={<Privacy />}
					/>
					<Route
						path={PATHS.PAGE_NOT_FOUND}
						element={<PageNotFound />}
					/>
					<Route
						path="*"
						element={
							<Navigate
								to={PATHS.PAGE_NOT_FOUND}
								replace
							/>
						}
					/>
				</Routes>
			</Suspense>
			<Footer />
			<TabBar />
		</>
	)
}

export default function App() {
	const inRouter = useInRouterContext()

	return inRouter ? (
		<AppRoutes />
	) : (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	)
}
