import { useState, useRef } from 'react';
import classNames from 'classnames';

import Button from '../button/Button';
import buttonStyles from '../button/Button.module.scss';

import headerStyles from './Header.module.scss';

import useClickOutside from './hooks/useClickOutside';
import useMobileMenu from './hooks/useMobileMenu';
import useLoggedInTravellerName from './hooks/useLoggedInTravellerName';

function Header() {
	const [travellerName, setTravellerName] = useLoggedInTravellerName();
	const [totalMessages, setTotalMessages] = useState(null);
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
				setIsMenuOpen(false);
			}
		}
	};

	useClickOutside(navMenuRef, closeHamburgerMenu);
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen);

	const handleActiveClassRemovalClick = (event) => {
		event.preventDefault();

		if (document.documentElement.clientWidth <= 768) {
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
		<header className={headerStyles.header}>
			<nav className={headerStyles.navbar}>
				<h1 className="navHeaderTitleLink">
					<Button isLink url="#" className="navLink">
						Trip Fotos
					</Button>
				</h1>
				<ul
					className={classNames(headerStyles.navMenuItemsContainer, {
						[headerStyles.active]: isMenuOpen,
					})}
					ref={navMenuRef}>
					<li className={headerStyles.navMenuItem}>
						<ul>
							<li
								className="navMenuItemMessages"
								onClick={handleActiveClassRemovalClick}>
								<Button isLink url="#" className="navLink">
									Messages
									{!!totalMessages && totalMessages > 0 && (
										<span
											className={
												buttonStyles.totalMessagesContainer
											}>
											<span
												className={
													buttonStyles.totalMessages
												}>
												{totalMessages}
											</span>
										</span>
									)}
								</Button>
							</li>
							<li
								className="navMenuItemAllTravellers"
								onClick={handleActiveClassRemovalClick}>
								<Button isLink url="#" className="navLink">
									All Travellers
								</Button>
							</li>
						</ul>
					</li>
					<li
						className={classNames(
							headerStyles.navMenuItem,
							'nav-menu-item-logout',
						)}
						onClick={handleLogoutClick}>
						<Button url="#" className="navLink">
							Logout {travellerName}
						</Button>
					</li>
				</ul>
				<div
					className={classNames(headerStyles.hamburger, {
						[headerStyles.active]: isMenuOpen,
					})}
					ref={hamburgerRef}>
					<span className={headerStyles.bar}></span>
					<span className={headerStyles.bar}></span>
					<span className={headerStyles.bar}></span>
				</div>
			</nav>
		</header>
	);
}

export default Header;
