import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import { PATHS } from '@/constants/ui'

import { loadMessages, selectMessagesCount } from '@/store/slices/messagesSlice'

import useClickOutsideToCloseDefault from './hooks/useClickOutsideToClose'
import useLogoutDefault from './hooks/useLogout'
import useMainNavStateDefault from './hooks/useMainNavState'

import BaseButton from '@/components/ui/button/BaseButton'
import { cn } from '@/utils/cn'

import NavMenuButtonLink from './nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink'

// Three bars that the toggle button turns into a cross while the menu is open
const barClasses =
	'mx-auto my-[0.3125rem] block h-[0.1875rem] w-[1.5625rem] bg-primary-foreground transition-colors duration-300 ease-in-out group-aria-expanded:first:translate-y-2 group-aria-expanded:first:rotate-45 group-aria-expanded:nth-2:opacity-0 group-aria-expanded:last:-translate-y-2 group-aria-expanded:last:-rotate-45'

function MainNav({
	isLoggedIn,
	isTraveller: isTravellerProp,
	useMainNavState = useMainNavStateDefault,
	useClickOutsideToClose = useClickOutsideToCloseDefault,
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

	const handleHamburgerClick = () => {
		setIsMenuOpen((prev) => !prev)
	}

	return (
		<>
			{isLoggedIn && (
				<>
					<nav
						data-cy="nav-menu-container"
						aria-label="Top navigation"
						role="navigation">
						<BaseButton
							ref={hamburgerRef}
							modeType="text"
							className="group hidden px-6 py-3 mobile:block"
							onClick={handleHamburgerClick}
							data-cy="hamburger-menu"
							aria-controls="nav-menu-items-container"
							aria-expanded={isMenuOpen}
							aria-label={
								isMenuOpen
									? 'Close navigation menu'
									: 'Open navigation menu'
							}>
							<span className={barClasses}></span>
							<span className={barClasses}></span>
							<span className={barClasses}></span>
						</BaseButton>
						<ul
							id="nav-menu-items-container"
							ref={navMenuRef}
							className={cn(
								'm-0 flex items-center justify-between p-0',
								// Off-screen alone leaves the closed menu's links keyboard-focusable
								'mobile:invisible mobile:absolute mobile:top-[4.9rem] mobile:left-[-100%] mobile:w-full mobile:flex-col mobile:bg-primary mobile:text-center mobile:shadow-menu',
								isMenuOpen && 'mobile:visible mobile:left-0',
							)}
							data-cy="nav-menu-items-container"
							aria-label="Main navigation menu">
							<li className="mx-2! mobile:mx-0! mobile:w-full">
								<ul className="m-0 flex items-center p-0 mobile:block [&>li]:mx-2! mobile:[&>li]:mx-0!">
									{isTraveller && (
										<NavMenuMessagesLink
											isLink
											to={PATHS.MESSAGES}
											isActive={
												location.pathname ===
												PATHS.MESSAGES
											}
											onMenuItemClick={
												handleMenuItemClick
											}
											data-cy="nav-menu-item-messages"
											totalMessages={totalMessages}
										/>
									)}
									<li>
										<NavMenuButtonLink
											isLink
											to={PATHS.TRAVELLERS}
											onMenuItemClick={
												handleMenuItemClick
											}
											isActive={
												location.pathname ===
												PATHS.TRAVELLERS
											}
											data-cy="nav-menu-item-travellers">
											Travellers
										</NavMenuButtonLink>
									</li>
								</ul>
							</li>
							<li className="mx-2! mobile:mx-0! mobile:w-full">
								<NavMenuButtonLink
									isLink
									to={PATHS.AUTHENTICATION}
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
	useLogout: PropTypes.func,
}

export default MainNav
