import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { NAVIGATION } from '@/constants/ui'

import {
	loadMessages,
	selectUnreadMessagesCount,
} from '@/store/slices/messagesSlice'

import useLoggedInTravellerNameDefault from './hooks/useLoggedInTravellerName'
import useLogoutDefault from './hooks/useLogout'
import usePrimaryNavItems from './hooks/usePrimaryNavItems'

import AccountMenu from './account-menu/AccountMenu'
import NavMenuButtonLink from './nav-menu/NavMenuButtonLink'
import NavMenuMessagesLink from './nav-menu/NavMenuMessagesLink'

function MainNav({
	isLoggedIn,
	isTraveller: isTravellerProp,
	useLoggedInTravellerName = useLoggedInTravellerNameDefault,
	useLogout = useLogoutDefault,
}) {
	const dispatch = useDispatch()

	const usersName = useSelector((state) => state.travellers.travellerName)
	const isTravellerFromStore = useSelector(
		(state) => state.travellers.isTraveller,
	)
	const isTraveller = isTravellerProp ?? isTravellerFromStore
	const unreadMessages = useSelector(selectUnreadMessagesCount)
	const navItems = usePrimaryNavItems({ isTraveller })

	const [travellerName, setTravellerName] = useLoggedInTravellerName()

	useEffect(() => {
		if (isLoggedIn) {
			setTravellerName(usersName)
		}
	}, [isLoggedIn, usersName, setTravellerName])

	// Messages are traveller-only; loading here keeps the count current without opening the Messages page
	useEffect(() => {
		if (isLoggedIn && isTraveller) {
			dispatch(loadMessages())
		}
	}, [isLoggedIn, isTraveller, dispatch])

	const handleLogOut = useLogout(setTravellerName)

	if (!isLoggedIn) {
		return null
	}

	return (
		<div className="flex h-full items-center gap-2 pr-4 mobile:pr-2">
			<nav
				className="h-full mobile:hidden"
				data-cy="nav-menu-container"
				aria-label={NAVIGATION.MAIN_LABEL}>
				<ul
					className="m-0 flex h-full list-none items-stretch p-0"
					data-cy="nav-menu-items-container">
					{navItems.map((item) =>
						item.key === 'messages' ? (
							<NavMenuMessagesLink
								key={item.key}
								to={item.to}
								isActive={item.isActive}
								unreadMessages={unreadMessages}
								data-cy="nav-menu-item-messages"
							/>
						) : (
							<li
								key={item.key}
								className="flex">
								<NavMenuButtonLink
									to={item.to}
									isActive={item.isActive}
									data-cy={`nav-menu-item-${item.key}`}>
									{item.label}
								</NavMenuButtonLink>
							</li>
						),
					)}
				</ul>
			</nav>
			<AccountMenu
				name={travellerName}
				onLogOut={handleLogOut}
			/>
		</div>
	)
}

MainNav.propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
	isTraveller: PropTypes.bool,
	useLoggedInTravellerName: PropTypes.func,
	useLogout: PropTypes.func,
}

export default MainNav
