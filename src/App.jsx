import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
	Routes,
	Route,
	Navigate,
	useNavigate,
	useLocation,
} from 'react-router-dom'

import { PATHS } from '@/constants/paths'

import { tryLogin } from '@/store/slices/authenticationSlice'

import Header from '@/components/layout/header/Header'
import UserAuth from '@/pages/authentication/UserAuth'
import Trips from '@/pages/trips/Trips'
import Messages from '@/pages/messages/Messages'
import PageNotFound from '@/pages/PageNotFound'

function App() {
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
			const protectedPaths = [PATHS.HOME, PATHS.TRIPS, PATHS.MESSAGES]
			if (protectedPaths.includes(location.pathname)) {
				navigate(PATHS.AUTHENTICATION, { replace: true })
			}
		}
	}, [isLoggedIn, location.pathname, navigate])

	return (
		<>
			<Header />
			<Routes>
				<Route
					path={PATHS.HOME}
					element={<Trips />}
				/>
				<Route
					path={PATHS.AUTHENTICATION}
					element={<UserAuth />}
				/>
				<Route
					path={PATHS.TRIPS}
					element={<Trips />}
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
		</>
	)
}

export default App
