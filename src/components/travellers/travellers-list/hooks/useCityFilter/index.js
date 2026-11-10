import { useCallback, useMemo, useState } from 'react'

import { formatCity, getCityId } from '@/utils/formatCity'

// Tick to narrow: nothing ticked shows every traveller; ticking cities shows only travellers who visited one of them
const useCityFilter = (travellers = []) => {
	const [tickedIds, setTickedIds] = useState([])
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

	// A Refresh can drop a city's last traveller; its tick goes with it, so a filter never hides everyone
	const selectedIds = useMemo(
		() =>
			tickedIds.filter((id) =>
				options.some((option) => option.id === id),
			),
		[tickedIds, options],
	)

	const toggleCity = useCallback((id, isSelected) => {
		setTickedIds((previous) => {
			if (!isSelected) return previous.filter((item) => item !== id)
			return previous.includes(id) ? previous : [...previous, id]
		})
	}, [])

	const showAllCities = useCallback(() => setTickedIds([]), [])

	const filteredTravellers = useMemo(() => {
		if (selectedIds.length === 0) return list

		return list.filter((traveller) =>
			(traveller?.cities ?? []).some((city) =>
				selectedIds.includes(getCityId(city)),
			),
		)
	}, [list, selectedIds])

	return {
		options,
		selectedIds,
		isFiltered: selectedIds.length > 0,
		toggleCity,
		showAllCities,
		filteredTravellers,
	}
}

export default useCityFilter
