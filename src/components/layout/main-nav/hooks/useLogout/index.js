import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { PATHS } from '@/constants/ui'

import { logout } from '@/store/slices/authenticationSlice'

function useLogout(setTravellerName) {
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleLogOut = () => {
		setTravellerName('')

		dispatch(logout())
		navigate(PATHS.AUTHENTICATION)
	}

	return handleLogOut
}

export default useLogout
