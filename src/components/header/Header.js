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
		<header className={headerStyles.header} data-cy="nav-header-container">
			<nav className={headerStyles.navbar}>
				<h1
					className="navHeaderTitleLink"
					data-cy="nav-header-title-link">
					<Button isLink to="/" className="navLink">
						Trip Fotos
					</Button>
				</h1>
				<ul
					className={classNames(headerStyles.navMenuItemsContainer, {
						[headerStyles.active]: isMenuOpen,
					})}
					data-cy="nav-menu-items-container"
					ref={navMenuRef}>
					<li className={headerStyles.navMenuItem}>
						<ul>
							<li
								className="navMenuItemMessages"
								data-cy="nav-menu-item-messages"
								onClick={handleActiveClassRemovalClick}>
								<Button isLink to="/" className="navLink">
									Messages
									{!!totalMessages && totalMessages > 0 && (
										<span
											className={
												buttonStyles.totalMessagesContainer
											}>
											<span
												className={
													buttonStyles.totalMessages
												}
												data-cy="total-messages">
												{totalMessages}
											</span>
										</span>
									)}
								</Button>
							</li>
							<li
								className="navMenuItemAllTravellers"
								data-cy="nav-menu-item-all-travellers"
								onClick={handleActiveClassRemovalClick}>
								<Button isLink to="/" className="navLink">
									All Travellers
								</Button>
							</li>
						</ul>
					</li>
					{/* <li
						className={classNames(
							headerStyles.navMenuItem,
							'nav-menu-item-login',
						)}
						data-cy="nav-menu-item-login"
						onClick={handleActiveClassRemovalClick}>
						<Button
							isLink
							to="/"
							className="navLink"
							data-cy="nav-login-link">
							Login
						</Button>
					</li> */}
					<li
						className={classNames(
							headerStyles.navMenuItem,
							'nav-menu-item-logout',
						)}
						onClick={handleLogoutClick}>
						<Button
							to="/"
							className="navLink"
							data-cy="nav-menu-item-logout">
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
