import { useState } from 'react'

import { useLoggedInTravellerName } from './useLoggedInTravellerName'

export function useMainNavState() {
	const [travellerName, setTravellerName] = useLoggedInTravellerName()
	const [totalMessages, setTotalMessages] = useState(null)
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	return {
		travellerName,
		setTravellerName,
		totalMessages,
		setTotalMessages,
		isMenuOpen,
		setIsMenuOpen,
	}
}
