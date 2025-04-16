import { useEffect } from 'react';

export function useMobileMenu(
	hamburgerRef,
	navMenuRef,
	setIsMenuOpen,
	isLoggedIn,
) {
	useEffect(() => {
		if (!isLoggedIn) return;

		const hamburger = hamburgerRef.current;

		const mobileMenu = (event) => {
			if (
				event.target === hamburger ||
				hamburger.contains(event.target)
			) {
				setIsMenuOpen((prev) => !prev);
				hamburger.classList.toggle('active');
				navMenuRef.current.classList.toggle('active');
			}
		};

		hamburger.addEventListener('click', mobileMenu);

		return () => {
			hamburger.removeEventListener('click', mobileMenu);
		};
	}, [hamburgerRef, navMenuRef, setIsMenuOpen, isLoggedIn]);
}
