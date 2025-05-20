import { useDispatch } from 'react-redux'

import { logout } from '@/store/slices/authenticationSlice'

export function useLogout(setTravellerName, setTotalMessages, setIsMenuOpen) {
	const dispatch = useDispatch()

	const handleLogoutClick = (event) => {
		event.preventDefault()

		setTravellerName('')
		setTotalMessages(null)
		setIsMenuOpen(false)

		dispatch(logout())
	}

	return handleLogoutClick
}
