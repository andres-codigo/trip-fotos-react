import { useDispatch } from 'react-redux'

import { logout } from '@/store/slices/authenticationSlice'

function useLogout(setTravellerName, setIsMenuOpen) {
	const dispatch = useDispatch()

	const handleLogoutClick = (event) => {
		event.preventDefault()

		setTravellerName('')
		setIsMenuOpen(false)

		dispatch(logout())
	}

	return handleLogoutClick
}

export default useLogout
