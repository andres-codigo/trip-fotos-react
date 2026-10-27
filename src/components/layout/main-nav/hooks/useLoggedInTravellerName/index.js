import { useState, useEffect, useCallback } from 'react'

import { SESSION_STORAGE_KEYS } from '@/constants/auth'

function useLoggedInTravellerName() {
	const [travellerName, setTravellerName] = useState(
		() => localStorage.getItem(SESSION_STORAGE_KEYS.USER_NAME) || '',
	)

	const syncTravellerName = useCallback(() => {
		const newValue = localStorage.getItem(SESSION_STORAGE_KEYS.USER_NAME)
		setTravellerName(newValue || '')
	}, [])

	useEffect(() => {
		// Only sync when storage changes in another tab/window
		// Initial value is already set via lazy initializer
		window.addEventListener('storage', syncTravellerName)

		return () => {
			window.removeEventListener('storage', syncTravellerName)
		}
	}, [syncTravellerName])

	return [travellerName, setTravellerName]
}

export default useLoggedInTravellerName
