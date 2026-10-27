import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { PATHS } from '@/constants/ui'

import { loadMessages, selectMessagesCount } from '@/store/slices/messagesSlice'

import useClickOutsideToCloseDefault from './hooks/useClickOutsideToClose'
import useLogoutDefault from './hooks/useLogout'
import useMainNavStateDefault from './hooks/useMainNavState'
import useMobileMenuDefault from './hooks/useMobileMenu'

import BaseButton from '@/components/ui/button/BaseButton'

import NavMenuButtonLink from './nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink'

import navMenuButtonLinkStyles from './nav-menu/NavMenuButtonLink.module.scss'
import mainNavStyles from './MainNav.module.scss'

function MainNav({
	isLoggedIn,
	isTraveller: isTravellerProp,
	useMainNavState = useMainNavStateDefault,
	useClickOutsideToClose = useClickOutsideToCloseDefault,
	useMobileMenu = useMobileMenuDefault,
	useLogout = useLogoutDefault,
}) {
	const location = useLocation()
	const dispatch = useDispatch()

	const usersName = useSelector((state) => state.travellers.travellerName)
	const isTravellerFromStore = useSelector(
		(state) => state.travellers.isTraveller,
	)
	const isTraveller = isTravellerProp ?? isTravellerFromStore
	const totalMessages = useSelector(selectMessagesCount)

	const { travellerName, setTravellerName, isMenuOpen, setIsMenuOpen } =
		useMainNavState()

	const hamburgerRef = useRef(null)
	const navMenuRef = useRef(null)

	useClickOutsideToClose(isMenuOpen, hamburgerRef, navMenuRef, setIsMenuOpen)
	useMobileMenu(hamburgerRef, navMenuRef, setIsMenuOpen, isLoggedIn)

	useEffect(() => {
		if (isLoggedIn) {
			setTravellerName(usersName)
		}
	}, [isLoggedIn, usersName, setTravellerName])

	// Messages are traveller-only; loading here keeps the badge current without opening the Messages page
	useEffect(() => {
		if (isLoggedIn && isTraveller) {
			dispatch(loadMessages())
		}
	}, [isLoggedIn, isTraveller, dispatch])

	const handleLogoutClick = useLogout(setTravellerName, setIsMenuOpen)

	const handleMenuItemClick = () => {
		setIsMenuOpen(false)
	}

	return (
		<>
			{isLoggedIn && (
				<>
					<nav
						className={mainNavStyles.navbar}
						data-cy="nav-menu-container"
						aria-label="Top navigation"
						role="navigation">
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
							data-cy="nav-menu-items-container"
							aria-label="Main navigation menu">
							<li className={mainNavStyles.navMenuItem}>
								<ul>
									{isTraveller && (
										<NavMenuMessagesLink
											isLink
											to={PATHS.MESSAGES}
											className={classNames(
												navMenuButtonLinkStyles.navMenuButtonLink,
												{
													[mainNavStyles.active]:
														location.pathname ===
														PATHS.MESSAGES,
												},
											)}
											onMenuItemClick={
												handleMenuItemClick
											}
											data-cy="nav-menu-item-messages"
											totalMessages={totalMessages}
										/>
									)}
									<li className="navMenuItemTravellers">
										<NavMenuButtonLink
											isLink
											to={PATHS.TRAVELLERS}
											onMenuItemClick={
												handleMenuItemClick
											}
											className={classNames(
												navMenuButtonLinkStyles.navMenuButtonLink,
												{
													[mainNavStyles.active]:
														location.pathname ===
														PATHS.TRAVELLERS,
												},
											)}
											data-cy="nav-menu-item-travellers">
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
									ariaLabel={`Logout ${travellerName}`}
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
	isTraveller: PropTypes.bool,
	useMainNavState: PropTypes.func,
	useClickOutsideToClose: PropTypes.func,
	useMobileMenu: PropTypes.func,
	useLogout: PropTypes.func,
}

export default MainNav
