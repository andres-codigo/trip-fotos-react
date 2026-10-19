import { useEffect, useState } from 'react'

import { CITY_SEARCH } from '@/constants/api'

export const CITY_SEARCH_STATUS = Object.freeze({
	IDLE: 'idle',
	LOADING: 'loading',
	SUCCESS: 'success',
	ERROR: 'error',
})

const toCity = ({ properties = {} } = {}) => {
	const {
		osm_type: osmType,
		osm_id: osmId,
		name,
		state,
		country,
	} = properties
	if (!name || !country || !osmId) return null
	return {
		id: `${osmType ?? ''}${osmId}`,
		city: name,
		region: state ?? '',
		country,
	}
}

const useCitySearch = (query) => {
	const [search, setSearch] = useState({
		term: '',
		results: [],
		status: CITY_SEARCH_STATUS.IDLE,
	})

	const term = query.trim()
	const isSearchable = term.length >= CITY_SEARCH.MIN_CHARACTERS

	useEffect(() => {
		if (!isSearchable) return undefined

		const controller = new AbortController()
		const timeout = setTimeout(async () => {
			setSearch({ term, results: [], status: CITY_SEARCH_STATUS.LOADING })

			try {
				const params = new URLSearchParams({
					q: term,
					layer: CITY_SEARCH.LAYER,
					lang: CITY_SEARCH.LANGUAGE,
					limit: String(CITY_SEARCH.LIMIT),
				})
				const response = await fetch(`${CITY_SEARCH.URL}?${params}`, {
					signal: controller.signal,
				})
				if (!response.ok) throw new Error(String(response.status))

				const data = await response.json()
				const seen = new Set()
				const results = (data.features ?? [])
					.map(toCity)
					.filter((city) => {
						if (!city || seen.has(city.id)) return false
						seen.add(city.id)
						return true
					})

				setSearch({ term, results, status: CITY_SEARCH_STATUS.SUCCESS })
			} catch (error) {
				if (error.name === 'AbortError') return
				setSearch({
					term,
					results: [],
					status: CITY_SEARCH_STATUS.ERROR,
				})
			}
		}, CITY_SEARCH.DEBOUNCE_MS)

		return () => {
			clearTimeout(timeout)
			controller.abort()
		}
	}, [term, isSearchable])

	if (!isSearchable) {
		return { results: [], status: CITY_SEARCH_STATUS.IDLE }
	}

	// Results belong to the term that produced them, so a newer query never shows stale cities
	if (search.term !== term) {
		return { results: [], status: CITY_SEARCH_STATUS.LOADING }
	}

	return { results: search.results, status: search.status }
}

export default useCitySearch
