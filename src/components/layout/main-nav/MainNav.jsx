import { useRef } from 'react'
// import { useNavigate } from 'react-router-dom';
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { PATHS } from '@/constants/paths'

import { useCloseHamburgerMenu as useCloseHamburgerMenuDefault } from './hooks/useCloseHamburgerMenu'
import { useLogout as useLogoutDefault } from './hooks/useLogout'
import { useMainNavState as useMainNavStateDefault } from './hooks/useMainNavState'
import { useMobileMenu as useMobileMenuDefault } from './hooks/useMobileMenu'

import BaseButton from '../../ui/button/BaseButton'

import NavMenuButtonLink from './nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink'

import navMenuButtonLinkStyles from './nav-menu/NavMenuButtonLink.module.scss'
import mainNavStyles from './MainNav.module.scss'

function MainNav({
	isLoggedIn,
	useMainNavState = useMainNavStateDefault,
	useCloseHamburgerMenu = useCloseHamburgerMenuDefault,
	useMobileMenu = useMobileMenuDefault,
	useLogout = useLogoutDefault,
}) {
	// const navigate = useNavigate();

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
		<>
			{isLoggedIn && (
				<>
					<nav
						className={mainNavStyles.navbar}
						data-cy="nav-menu-container"
						aria-label="Top navigation">
						<BaseButton
							ref={hamburgerRef}
							className={classNames(mainNavStyles.hamburger, {
								[mainNavStyles.active]: isMenuOpen,
							})}
							data-cy="hamburger-menu"
							aria-controls="hamburger-menu-items-container"
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
						<ul
							id="nav-menu-items-container"
							ref={navMenuRef}
							className={classNames(
								mainNavStyles.navMenuItemsContainer,
								{
									[mainNavStyles.active]: isMenuOpen,
								},
							)}
							data-cy="nav-menu-items-container">
							<li className={mainNavStyles.navMenuItem}>
								<ul>
									{/* {isTraveller && ( */}
									<NavMenuMessagesLink
										isLink
										className={
											navMenuButtonLinkStyles.navMenuButtonLink
										}
										to={PATHS.MESSAGES}
										dataCypress="nav-menu-item-messages"
										totalMessages={totalMessages}
									/>
									{/* )} */}
									<li
										className="navMenuItemTravellers"
										data-cy="nav-menu-item-travellers">
										<NavMenuButtonLink
											isLink
											to={PATHS.TRIPS}
											className={
												navMenuButtonLinkStyles.navMenuButtonLink
											}>
											Travellers
										</NavMenuButtonLink>
									</li>
								</ul>
							</li>
							<li
								className={classNames(
									mainNavStyles.navMenuItem,
									'nav-menu-item-logout',
								)}>
								<NavMenuButtonLink
									isLink
									to={PATHS.AUTHENTICATION}
									className={
										navMenuButtonLinkStyles.navMenuButtonLink
									}
									data-cy="nav-menu-item-logout"
									onClick={handleLogoutClick}>
									Logout {travellerName}
								</NavMenuButtonLink>
							</li>
						</ul>
					</nav>
				</>
			)}
		</>
	)
}

MainNav.propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
	useMainNavState: PropTypes.func,
	useCloseHamburgerMenu: PropTypes.func,
	useMobileMenu: PropTypes.func,
	useLogout: PropTypes.func,
}

export default MainNav
