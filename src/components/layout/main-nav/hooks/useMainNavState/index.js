import { useState } from 'react'

import useLoggedInTravellerName from '@/components/layout/main-nav/hooks/useLoggedInTravellerName'

function useMainNavState() {
	const [travellerName, setTravellerName] = useLoggedInTravellerName()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	return {
		travellerName,
		setTravellerName,
		isMenuOpen,
		setIsMenuOpen,
	}
}

export default useMainNavState
