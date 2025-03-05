import styles from './Header.module.scss';
import { useState, useRef } from 'react';
import classNames from 'classnames';

import useClickOutside from './hooks/useClickOutside';
import useMobileMenu from './hooks/useMobileMenu';
import useLoggedInTravellerName from './hooks/useLoggedInTravellerName';

function Header() {
	const [travellerName, setTravellerName] = useLoggedInTravellerName();
	const [totalMessages, setTotalMessages] = useState(3);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const hamburgerRef = useRef(null);
	const navMenuRef = useRef(null);

	const closeHamburgerMenu = (event) => {
		if (document.documentElement.clientWidth <= 768) {
			const hamburger = hamburgerRef.current;
			const navMenu = navMenuRef.current;
			if (
				isMenuOpen &&
				!hamburger.contains(event.target) &&
				!navMenu.contains(event.target)
			) {
				hamburger.classList.remove('active');
				navMenu.classList.remove('active');
				setIsMenuOpen(false);
			}
		}
	};

	useClickOutside(navMenuRef, closeHamburgerMenu);
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen);

	const handleActiveClassRemovalClick = (event) => {
		event.preventDefault();

		if (document.documentElement.clientWidth <= 768) {
			const hamburger = hamburgerRef.current;
			const navMenu = navMenuRef.current;

			hamburger.classList.remove('active');
			navMenu.classList.remove('active');
			setIsMenuOpen(false);
		}
	};

	const handleLogoutClick = async (event) => {
		event.preventDefault();

		setTravellerName('');
		setTotalMessages(null);
		handleActiveClassRemovalClick(event);

		// await this.$store.dispatch('logout').then(() => {
		// 	this.$router.go('/')
		// })
	};

	return (
		<header className={styles.header}>
			<nav className={styles.navbar}>
				<h1 className="navHeaderTitleLink">Trip Fotos</h1>
				<ul
					className={classNames(styles.navMenuItemsContainer, {
						[styles.active]: isMenuOpen,
					})}
					ref={navMenuRef}>
					<li className={styles.navMenuItem}>
						<ul>
							<li
								className="navMenuItemMessages"
								onClick={handleActiveClassRemovalClick}>
								<a className="navLink">
									Messages
									{!!totalMessages && totalMessages > 0 && (
										<span
											className={
												styles.totalMessagesContainer
											}>
											<span
												className={
													styles.totalMessages
												}>
												{totalMessages}
											</span>
										</span>
									)}
								</a>
							</li>
							<li
								className="navMenuItemAllTravellers"
								onClick={handleActiveClassRemovalClick}>
								<a className="navLink">All Travellers</a>
							</li>
						</ul>
					</li>
					<li
						className="navMenuItem  nav-menu-item-logout"
						onClick={handleLogoutClick}>
						Logout
					</li>
				</ul>
				<div
					className={classNames(styles.hamburger, {
						[styles.active]: isMenuOpen,
					})}
					ref={hamburgerRef}>
					<span className={styles.bar}></span>
					<span className={styles.bar}></span>
					<span className={styles.bar}></span>
				</div>
			</nav>
		</header>
	);
}

export default Header;
