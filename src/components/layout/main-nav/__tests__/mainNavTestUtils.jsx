import { useState } from 'react'
import PropTypes from 'prop-types'

import { useCloseHamburgerMenu as useCloseHamburgerMenuDefault } from '../hooks/useCloseHamburgerMenu'
import { useMobileMenu as useMobileMenuDefault } from '../hooks/useMobileMenu'

import MainNav from '../MainNav'

export const TestMainNav = ({
	isLoggedIn = true,
	isMenuOpen: initialMenuOpen = true,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(initialMenuOpen)

	return (
		<MainNav
			isLoggedIn={isLoggedIn}
			useMainNavState={() => ({
				travellerName: 'Test User',
				setTravellerName: () => {},
				setTotalMessages: () => {},
				isMenuOpen,
				setIsMenuOpen,
			})}
			useCloseHamburgerMenu={useCloseHamburgerMenuDefault}
			useMobileMenu={useMobileMenuDefault}
			useLogout={() => {}}
		/>
	)
}

TestMainNav.propTypes = {
	isLoggedIn: PropTypes.bool,
	isMenuOpen: PropTypes.bool,
}
