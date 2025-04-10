import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
// import { useSelector, useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
import { tryLogin } from './store/slices/authenticationSlice';

import './App.module.scss';
import Header from './components/layout/header/Header';

function App() {
	const dispatch = useDispatch();
	// const navigate = useNavigate();

	// Access the `didAutoLogout` state from the Redux store
	// const didAutoLogout = useSelector((state) => state.authentication.didAutoLogout);

	// Dispatch `tryLogin` on component mount
	useEffect(() => {
		dispatch(tryLogin());
	}, [dispatch]);

	// Watch for changes in `didAutoLogout` and redirect to the login page
	// useEffect(() => {
	// 	if (didAutoLogout) {
	// 		navigate('/authentication'); // Redirect to the login page
	// 	}
	// }, [didAutoLogout, navigate]);

	return <Header />;
}

export default App;
