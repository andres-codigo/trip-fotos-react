import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { tryLogin } from './store/slices/authenticationSlice';

import { PATHS } from './constants/paths';

import './App.module.scss';
import Header from './components/layout/header/Header';
import UserAuth from './pages/UserAuth';

function App() {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	// Access the `didAutoLogout` state from the Redux store
	const didAutoLogout = useSelector(
		(state) => state.authentication.didAutoLogout,
	);

	// Dispatch `tryLogin` on component mount
	useEffect(() => {
		dispatch(tryLogin());
	}, [dispatch]);

	// Watch for changes in `didAutoLogout` and redirect to the login page
	useEffect(() => {
		if (didAutoLogout) {
			navigate(PATHS.AUTHENTICATION);
		}
	}, [didAutoLogout, navigate]);

	return (
		<>
			<Header />
			<Routes>
				<Route index path={PATHS.HOME} element={<UserAuth />} />
				<Route path={PATHS.AUTHENTICATION} element={<UserAuth />} />
				<Route path={PATHS.TRIPS} element={<UserAuth />} />
			</Routes>
		</>
	);
}

export default App;
