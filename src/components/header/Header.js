import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';

import { logout } from '../../store/slices/authSlice';

import Button from '../button/Button';
import buttonStyles from '../button/Button.module.scss';

import headerStyles from './Header.module.scss';

import useClickOutside from './hooks/useClickOutside';
import useMobileMenu from './hooks/useMobileMenu';
import useLoggedInTravellerName from './hooks/useLoggedInTravellerName';

function Header() {
	const dispatch = useDispatch();
	// const navigate = useNavigate();

	const isLoggedIn = useSelector((state) => state.auth.token !== null);
	// const usersName = useSelector((state) => state.travellers.travellerName);
	// const isTraveller = useSelector((state) => state.travellers.isTraveller);
	// const messagesCount = useSelector((state) => state.messages.messagesCount);

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

	//// START

	/// TODO: ENSURE THIS IS WORKING CORRECTLY ONCE TRAVELLERS AND MESSAGES STORE IS ADDED
	/// UPDATE IMPORT LINE 1: import { useEffect, useState, useRef } from 'react';

	// useEffect(() => {
	// 	setTravellerName(usersName);
	// }, [usersName, setTravellerName]);

	// useEffect(() => {
	// 	setTotalMessages(messagesCount);
	// }, [messagesCount]);

	// useEffect(() => {
	// 	if (isLoggedIn) {
	// 		setTravellerName();
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

	useClickOutside(navMenuRef, closeHamburgerMenu);
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen, isLoggedIn);

	const handleActiveClassRemovalClick = (event) => {
		event.preventDefault();

		if (document.documentElement.clientWidth <= 768) {
			setIsMenuOpen(false);
		}
	};

	const handleLogoutClick = (event) => {
		event.preventDefault();

		setTravellerName('');
		setTotalMessages(null);
		handleActiveClassRemovalClick(event);

		dispatch(logout());

		// navigate('/');
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
					{isLoggedIn && (
						<li className={headerStyles.navMenuItem}>
							<ul>
								{/* {isTraveller && ( */}
								<li
									className="navMenuItemMessages"
									data-cy="nav-menu-item-messages"
									onClick={handleActiveClassRemovalClick}>
									<Button isLink to="/" className="navLink">
										Messages
										{!!totalMessages &&
											totalMessages > 0 && (
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
								{/* )} */}
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
					)}
					{/* /// TODO: When routing is enabled add !== to 'auth' url to isLoggedIn condition */}
					{isLoggedIn && (
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
