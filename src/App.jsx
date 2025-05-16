import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import { PATHS } from '@/constants/paths'

import { tryLogin } from '@/store/slices/authenticationSlice'

import Header from '@/components/layout/header/Header'
import UserAuth from '@/pages/authentication/UserAuth'
import Trips from '@/pages/trips/Trips'
import Messages from '@/pages/messages/Messages'

function App() {
	const dispatch = useDispatch()
	const navigate = useNavigate()

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

	return (
		<>
			<Header />
			<Routes>
				{!isLoggedIn && (
					<>
						<Route
							path={PATHS.AUTHENTICATION}
							element={<UserAuth />}
						/>
						<Route
							path="*"
							element={<Navigate to={PATHS.AUTHENTICATION} />}
						/>
					</>
				)}

				{isLoggedIn && (
					<>
						<Route
							path={PATHS.HOME}
							element={<Trips />}
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
							path="*"
							element={<Navigate to={PATHS.HOME} />}
						/>
					</>
				)}
			</Routes>
		</>
	)
}

export default App
