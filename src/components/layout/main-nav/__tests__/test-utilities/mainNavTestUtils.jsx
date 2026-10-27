import { useState } from 'react'
import PropTypes from 'prop-types'

import useCloseHamburgerMenuDefault from '@/components/layout/main-nav/hooks/useClickOutsideToClose'
import useMobileMenuDefault from '@/components/layout/main-nav/hooks/useMobileMenu'

import MainNav from '@/components/layout/main-nav/MainNav'

export const TestMainNav = ({
	isLoggedIn = true,
	isTraveller = false,
	isMenuOpen: initialMenuOpen = true,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(initialMenuOpen)

	return (
		<MainNav
			isLoggedIn={isLoggedIn}
			isTraveller={isTraveller}
			useMainNavState={() => ({
				travellerName: 'Test User',
				setTravellerName: () => {},
				isMenuOpen,
				setIsMenuOpen,
			})}
			useClickOutsideToClose={useCloseHamburgerMenuDefault}
			useMobileMenu={useMobileMenuDefault}
			useLogout={() => {}}
		/>
	)
}

TestMainNav.propTypes = {
	isLoggedIn: PropTypes.bool,
	isTraveller: PropTypes.bool,
	isMenuOpen: PropTypes.bool,
}
