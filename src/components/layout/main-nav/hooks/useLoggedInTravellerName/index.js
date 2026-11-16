import { useState } from 'react'
import { useSelector } from 'react-redux'

import { selectTravellerName } from '@/store/slices/travellersSlice'

// Starts from the persisted name so the account menu is named on the first paint after a reload
function useLoggedInTravellerName() {
	const storedName = useSelector(selectTravellerName)
	return useState(storedName || '')
}

export default useLoggedInTravellerName
