import { useSelector } from 'react-redux'
import { useRef } from 'react'
// import { useNavigate } from 'react-router-dom';
import classNames from 'classnames'

import { PATHS } from '@/constants/paths'

import { useCloseHamburgerMenu } from './hooks/useCloseHamburgerMenu'
import { useLogout } from './hooks/useLogout'
import { useMainNavState } from './hooks/useMainNavState'
import { useMobileMenu } from './hooks/useMobileMenu'

import BaseButton from '../../ui/button/BaseButton'

import NavMenuButtonLink from './nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink'

import navMenuButtonLinkStyles from './nav-menu/NavMenuButtonLink.module.scss'
import mainNavStyles from './MainNav.module.scss'

function MainNav() {
	// const navigate = useNavigate();

	const isLoggedIn = useSelector(
		(state) => state.authentication.token !== null,
	)
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
	} = useMainNavState()

	const hamburgerRef = useRef(null)
	const navMenuRef = useRef(null)

	useCloseHamburgerMenu(isMenuOpen, hamburgerRef, navMenuRef, setIsMenuOpen)
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen, isLoggedIn)

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
	)

	return (
		<nav
			className={mainNavStyles.navbar}
			aria-label="Top navigation">
			<h1
				className="siteHeaderTitleLink"
				data-cy="site-header-title-link">
				<NavMenuButtonLink
					isLink
					to={isLoggedIn ? PATHS.TRIPS : PATHS.AUTHENTICATION}
					className={navMenuButtonLinkStyles.navMenuButtonLink}>
					Trip Fotos
				</NavMenuButtonLink>
			</h1>
			{isLoggedIn && (
				<BaseButton
					ref={hamburgerRef}
					className={classNames(mainNavStyles.hamburger, {
						[mainNavStyles.active]: isMenuOpen,
					})}
					data-cy="hamburger-menu"
					aria-controls="nav-menu-items-container"
					aria-expanded={isMenuOpen}
					aria-label={
						isMenuOpen
							? 'Close navigation menu'
							: 'Open navigation menu'
					}>
					<span className={mainNavStyles.bar}></span>
					<span className={mainNavStyles.bar}></span>
					<span className={mainNavStyles.bar}></span>
				</BaseButton>
			)}
			<ul
				id="nav-menu-items-container"
				ref={navMenuRef}
				className={classNames(mainNavStyles.navMenuItemsContainer, {
					[mainNavStyles.active]: isMenuOpen,
				})}
				data-cy="nav-menu-items-container">
				{isMenuOpen && (
					<>
						{isLoggedIn && (
							<li className={mainNavStyles.navMenuItem}>
								<ul>
									{/* {isTraveller && ( */}
									<NavMenuMessagesLink
										className={
											navMenuButtonLinkStyles.navMenuButtonLink
										}
										to={PATHS.MESSAGES}
										data-cy="nav-menu-item-messages"
										totalMessages={totalMessages}
									/>
									{/* )} */}
									<li
										className="navMenuItemTravellers"
										data-cy="nav-menu-item-travellers">
										<NavMenuButtonLink
											isLink
											to="/"
											className={
												navMenuButtonLinkStyles.navMenuButtonLink
											}>
											Travellers
										</NavMenuButtonLink>
									</li>
								</ul>
							</li>
						)}
						{/* /// TODO: When routing is enabled add !== to 'authentication' url to isLoggedIn condition */}
						{isLoggedIn && (
							<li
								className={classNames(
									mainNavStyles.navMenuItem,
									'nav-menu-item-logout',
								)}>
								<NavMenuButtonLink
									className={
										navMenuButtonLinkStyles.navMenuButtonLink
									}
									data-cy="nav-menu-item-logout"
									onClick={handleLogoutClick}>
									Logout {travellerName}
								</NavMenuButtonLink>
							</li>
						)}
					</>
				)}
			</ul>
		</nav>
	)
}

export default MainNav
