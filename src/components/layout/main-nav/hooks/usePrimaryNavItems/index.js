import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { NAVIGATION, PATHS } from '@/constants/ui'
import { selectUserId } from '@/store/slices/authenticationSlice'
import { selectUnreadMessagesCount } from '@/store/slices/messagesSlice'
import { selectIsTraveller } from '@/store/slices/travellersSlice'

// Shared by the desktop nav and the tab bar; isTraveller overrides the store value when given
function usePrimaryNavItems({ isTraveller } = {}) {
	const isTravellerFromStore = useSelector(selectIsTraveller)
	const userId = useSelector(selectUserId)
	const unreadMessages = useSelector(selectUnreadMessagesCount)
	const { pathname } = useLocation()

	const resolvedIsTraveller = isTraveller ?? isTravellerFromStore

	return useMemo(() => {
		const travellersItem = {
			key: 'travellers',
			label: NAVIGATION.TRAVELLERS,
			to: PATHS.TRAVELLERS,
			isActive: pathname === PATHS.TRAVELLERS || pathname === PATHS.HOME,
		}

		if (!resolvedIsTraveller) {
			return [
				travellersItem,
				{
					key: 'register',
					label: NAVIGATION.REGISTER,
					to: PATHS.REGISTER,
					isActive: pathname === PATHS.REGISTER,
				},
			]
		}

		const myTripPath = `${PATHS.TRAVELLERS}/${userId}`

		return [
			travellersItem,
			{
				key: 'messages',
				label: NAVIGATION.MESSAGES,
				to: PATHS.MESSAGES,
				isActive: pathname === PATHS.MESSAGES,
				unreadMessages,
			},
			{
				key: 'my-trip',
				label: NAVIGATION.MY_TRIP,
				to: myTripPath,
				isActive:
					pathname === myTripPath ||
					pathname ===
						`${myTripPath}${TRAVELLER_ITEM_CONFIG.EDIT_PATH_SEGMENT}`,
			},
		]
	}, [resolvedIsTraveller, userId, unreadMessages, pathname])
}

export default usePrimaryNavItems
