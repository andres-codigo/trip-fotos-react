import { useEffect, lazy, Suspense } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
	BrowserRouter,
	useInRouterContext,
} from 'react-router-dom'

import { PATHS } from '@/constants/ui'

import { tryLogin } from '@/store/slices/authenticationSlice'

import LoadingFallback from '@/components/common/LoadingFallback'

import Header from '@/components/layout/header/Header'
const Authentication = lazy(
	() => import('@/pages/authentication/Authentication'),
)
// TODO: Review requirement for Home page at a later stage
// const Home = lazy(() => import('@/pages/home/Home'))
const Register = lazy(() => import('@/pages/register/Register'))
const Travellers = lazy(() => import('@/pages/travellers/Travellers'))
const Messages = lazy(() => import('@/pages/messages/Messages'))
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

	// Dispatch `tryLogin` on component mount
	useEffect(() => {
		dispatch(tryLogin())
	}, [dispatch])

	// Watch for changes in `didAutoLogout` and redirect to the login page
	useEffect(() => {
		if (didAutoLogout) {
			navigate(PATHS.AUTHENTICATION)
		}
	}, [didAutoLogout, navigate])

	// Watch for changes in `isLoggedIn` and redirect to the login page if not logged in
	useEffect(() => {
		const publicPaths = [PATHS.AUTHENTICATION, PATHS.PAGENOTFOUND]
		const isPublic = publicPaths.includes(location.pathname)

		if (!isLoggedIn && !isPublic) {
			// Only redirect if the route is a known protected route
			const protectedPaths = [
				PATHS.HOME,
				PATHS.TRAVELLERS,
				PATHS.MESSAGES,
			]
			if (protectedPaths.includes(location.pathname)) {
				navigate(PATHS.AUTHENTICATION, { replace: true })
			}
		}
	}, [isLoggedIn, location.pathname, navigate])

	return (
		<>
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
						path={PATHS.MESSAGES}
						element={<Messages />}
					/>
					<Route
						path={PATHS.PAGENOTFOUND}
						element={<PageNotFound />}
					/>
					<Route
						path="*"
						element={
							<Navigate
								to={PATHS.PAGENOTFOUND}
								replace
							/>
						}
					/>
				</Routes>
			</Suspense>
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
