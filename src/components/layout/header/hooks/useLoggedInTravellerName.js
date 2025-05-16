import { useState, useEffect, useCallback } from 'react'

export function useLoggedInTravellerName() {
	const [travellerName, setTravellerName] = useState(
		() => localStorage.getItem('userName') || '',
	)

	// Function to sync state with localStorage
	const syncTravellerName = useCallback(() => {
		const newValue = localStorage.getItem('userName')
		setTravellerName(newValue || '')
	}, [])

	useEffect(() => {
		// Sync state on mount
		syncTravellerName()

		// Add event listener for storage changes
		window.addEventListener('storage', syncTravellerName)

		// Cleanup event listener on unmount
		return () => {
			window.removeEventListener('storage', syncTravellerName)
		}
	}, [syncTravellerName])

	return [travellerName, setTravellerName]
}
