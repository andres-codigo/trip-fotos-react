import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PATHS } from '@/constants/paths';

import { logout } from '@/store/slices/authenticationSlice';

export function useLogout(setTravellerName, setTotalMessages, setIsMenuOpen) {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const handleLogoutClick = (event) => {
		event.preventDefault();

		setTravellerName('');
		setTotalMessages(null);
		setIsMenuOpen(false);

		dispatch(logout());

		navigate(PATHS.AUTHENTICATION);
	};

	return handleLogoutClick;
}
