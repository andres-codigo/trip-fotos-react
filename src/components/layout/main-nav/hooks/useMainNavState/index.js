import { useState } from 'react'

import { useLoggedInTravellerName } from '@/components/layout/main-nav/hooks/useLoggedInTravellerName/index'

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
