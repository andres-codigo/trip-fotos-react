import { useEffect } from 'react';

const useMobileMenu = (hamburgerRef, navMenuRef, setIsMenuOpen) => {
	useEffect(() => {
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
	}, [hamburgerRef, navMenuRef, setIsMenuOpen]);
};

export default useMobileMenu;
