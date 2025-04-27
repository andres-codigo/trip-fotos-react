import { useSelector } from 'react-redux';
import { useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

import { useCloseHamburgerMenu } from './hooks/useCloseHamburgerMenu';
import { useHeaderState } from './hooks/useHeaderState';
import { useLogout } from './hooks/useLogout';
import { useMobileMenu } from './hooks/useMobileMenu';

import NavMenuButtonLink from './nav-menu/NavMenuButtonLink';
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink';

import NavMenuButtonLinkStyles from './nav-menu/NavMenuButtonLink.module.scss';
import headerStyles from './Header.module.scss';

function Header() {
	// const navigate = useNavigate();

	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	);
	// const usersName = useSelector((state) => state.travellers.travellerName);
	// const isTraveller = useSelector((state) => state.travellers.isTraveller);
	// const messagesCount = useSelector((state) => state.messages.messagesCount);

	const {
		travellerName,
		setTravellerName,
		totalMessages,
		setTotalMessages,
		isMenuOpen,
		setIsMenuOpen,
	} = useHeaderState();

	const hamburgerRef = useRef(null);
	const navMenuRef = useRef(null);

	useCloseHamburgerMenu(isMenuOpen, hamburgerRef, navMenuRef, setIsMenuOpen);
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen, isLoggedIn);

	//// START

	/// TODO: ENSURE THIS IS WORKING CORRECTLY ONCE TRAVELLERS AND MESSAGES STORE IS ADDED
	/// UPDATE IMPORT LINE 1: import { useEffect, useState, useRef } from 'react';

	// useEffect(() => {
	// 	setTotalMessages(messagesCount);
	// }, [messagesCount]);

	// useEffect(() => {
	// 	if (isLoggedIn) {
	// 		setTravellerName(usersName);
	// 		if (totalMessages === null) {
	// 			setMessageCount();
	// 		}
	// 	}
	// }, [isLoggedIn, totalMessages, setTravellerName]);

	// const setMessageCount = () => {
	// 	dispatch({ type: 'messages/loadMessages' }).then(() => {
	// 		setTotalMessages(messagesCount);
	// 	});
	// };

	//// END

	const handleLogoutClick = useLogout(
		setTravellerName,
		setTotalMessages,
		setIsMenuOpen,
	);

	return (
		<header className={headerStyles.siteHeader} data-cy="site-header">
			<nav className={headerStyles.navbar}>
				<h1
					className="siteHeaderTitleLink"
					data-cy="site-header-title-link">
					<NavMenuButtonLink
						isLink
						to="/"
						className={NavMenuButtonLinkStyles.navMenuButtonLink}>
						Trip Fotos
					</NavMenuButtonLink>
				</h1>
				<ul
					className={classNames(headerStyles.navMenuItemsContainer, {
						[headerStyles.active]: isMenuOpen,
					})}
					data-cy="nav-menu-items-container"
					ref={navMenuRef}>
					{isLoggedIn && (
						<li className={headerStyles.navMenuItem}>
							<ul>
								{/* {isTraveller && ( */}
								<NavMenuMessagesLink
									className={
										NavMenuButtonLinkStyles.navMenuButtonLink
									}
									totalMessages={totalMessages}
								/>
								{/* )} */}
								<li
									className="navMenuItemAllTravellers"
									data-cy="nav-menu-item-all-travellers">
									<NavMenuButtonLink
										isLink
										to="/"
										className={
											NavMenuButtonLinkStyles.navMenuButtonLink
										}>
										All Travellers
									</NavMenuButtonLink>
								</li>
							</ul>
						</li>
					)}
					{/* /// TODO: When routing is enabled add !== to 'authentication' url to isLoggedIn condition */}
					{isLoggedIn && (
						<li
							className={classNames(
								headerStyles.navMenuItem,
								'nav-menu-item-logout',
							)}
							onClick={handleLogoutClick}>
							<NavMenuButtonLink
								to="/"
								className={
									NavMenuButtonLinkStyles.navMenuButtonLink
								}
								data-cy="nav-menu-item-logout">
								Logout {travellerName}
							</NavMenuButtonLink>
						</li>
					)}
				</ul>
				{isLoggedIn && (
					<div
						className={classNames(headerStyles.hamburger, {
							[headerStyles.active]: isMenuOpen,
						})}
						ref={hamburgerRef}>
						<span className={headerStyles.bar}></span>
						<span className={headerStyles.bar}></span>
						<span className={headerStyles.bar}></span>
					</div>
				)}
			</nav>
		</header>
	);
}

export default Header;
