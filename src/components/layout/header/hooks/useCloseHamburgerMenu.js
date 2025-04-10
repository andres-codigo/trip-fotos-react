import { useEffect } from 'react';

export function useCloseHamburgerMenu(
	isMenuOpen,
	hamburgerRef,
	navMenuRef,
	setIsMenuOpen,
) {
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				document.documentElement.clientWidth <= 768 &&
				isMenuOpen &&
				!hamburgerRef.current.contains(event.target) &&
				!navMenuRef.current.contains(event.target)
			) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [isMenuOpen, hamburgerRef, navMenuRef, setIsMenuOpen]);
}
