import { useEffect } from 'react'

import { GLOBAL } from '@/constants/global'

export function useClickOutsideToClose(
	isMenuOpen,
	hamburgerRef,
	navMenuRef,
	setIsMenuOpen,
) {
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				document.documentElement.clientWidth <=
					GLOBAL.BREAKPOINT.MOBILE &&
				isMenuOpen &&
				!hamburgerRef.current.contains(event.target) &&
				!navMenuRef.current.contains(event.target)
			) {
				setIsMenuOpen(false)
			}
		}

		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	}, [isMenuOpen, hamburgerRef, navMenuRef, setIsMenuOpen])
}
