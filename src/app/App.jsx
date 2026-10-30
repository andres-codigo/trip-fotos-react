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

import LoadingFallback from '@/components/common/LoadingFallback'

import SkipLink from '@/components/layout/skip-link/SkipLink'
import Header from '@/components/layout/header/Header'
import Footer from '@/components/layout/footer/Footer'
const Authentication = lazy(
	() => import('@/pages/authentication/Authentication'),
)
const Register = lazy(() => import('@/pages/register/Register'))
const Travellers = lazy(() => import('@/pages/travellers/Travellers'))
const TravellerDetail = lazy(
	() => import('@/pages/traveller-detail/TravellerDetail'),
)
const ContactTraveller = lazy(
	() => import('@/pages/contact-traveller/ContactTraveller'),
)
const Messages = lazy(() => import('@/pages/messages/Messages'))
const Privacy = lazy(() => import('@/pages/privacy/Privacy'))
import PageNotFound from '@/pages/page-not-found/PageNotFound'

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

	// Watch for changes in `didAutoLogout` and redirect to the login page
	useEffect(() => {
		if (didAutoLogout) {
			navigate(PATHS.AUTHENTICATION)
		}
	}, [didAutoLogout, navigate])

	// Watch for changes in `isLoggedIn` and redirect to the login page if not logged in
	useEffect(() => {
		const publicPaths = [
			PATHS.AUTHENTICATION,
			PATHS.PRIVACY,
			PATHS.PAGE_NOT_FOUND,
		]
		const isPublic = publicPaths.includes(location.pathname)

		if (!isLoggedIn && !isPublic) {
			// Only redirect if the route is a known protected route
			const protectedPaths = [
				PATHS.HOME,
				PATHS.TRAVELLERS,
				PATHS.REGISTER,
				PATHS.MESSAGES,
				PATHS.TRAVELLER_DETAIL,
				PATHS.CONTACT_TRAVELLER,
			]
			if (
				protectedPaths.some((path) =>
					matchPath(path, location.pathname),
				)
			) {
				navigate(PATHS.AUTHENTICATION, { replace: true })
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
			<Suspense fallback={<LoadingFallback />}>
				<Routes>
					<Route
						path={PATHS.HOME}
						element={<Travellers />}
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
						element={<Travellers />}
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
						path={PATHS.MESSAGES}
						element={<Messages />}
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
