import { useState, useEffect, useCallback } from 'react'

export function useLoggedInTravellerName() {
	const [travellerName, setTravellerName] = useState(
		() => localStorage.getItem('userName') || '',
	)

	const syncTravellerName = useCallback(() => {
		const newValue = localStorage.getItem('userName')
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
