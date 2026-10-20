import { useCallback, useMemo, useState } from 'react'

import { formatCity, getCityId } from '@/utils/formatCity'

const useCityFilter = (travellers = []) => {
	const [inactiveIds, setInactiveIds] = useState([])
	const list = useMemo(
		() => (Array.isArray(travellers) ? travellers : []),
		[travellers],
	)

	const options = useMemo(() => {
		const byId = new Map()

		list.forEach((traveller) => {
			;(traveller?.cities ?? []).forEach((city) => {
				const id = getCityId(city)
				if (id && !byId.has(id)) {
					byId.set(id, { id, label: formatCity(city) })
				}
			})
		})

		return [...byId.values()].sort((a, b) =>
			a.label.localeCompare(b.label, 'en-GB'),
		)
	}, [list])

	const toggleCity = useCallback((id, isActive) => {
		setInactiveIds((previous) => {
			if (isActive) return previous.filter((item) => item !== id)
			return previous.includes(id) ? previous : [...previous, id]
		})
	}, [])

	const filteredTravellers = useMemo(() => {
		if (inactiveIds.length === 0) return list

		return list.filter((traveller) =>
			(traveller?.cities ?? []).some((city) => {
				const id = getCityId(city)
				return id && !inactiveIds.includes(id)
			}),
		)
	}, [list, inactiveIds])

	return { options, inactiveIds, toggleCity, filteredTravellers }
}

export default useCityFilter
