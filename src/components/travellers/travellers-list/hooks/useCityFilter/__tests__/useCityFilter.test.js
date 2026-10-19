import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { MOCK_CITIES } from '@/constants/test'

import useCityFilter from '@/components/travellers/travellers-list/hooks/useCityFilter'

const { TOKYO, PRAGUE } = MOCK_CITIES

const TRAVELLERS = [
	{ id: 'a', cities: [TOKYO, PRAGUE] },
	{ id: 'b', cities: [PRAGUE] },
	{ id: 'c', cities: ['tokyo'] },
	{ id: 'd', cities: [] },
]

describe('useCityFilter', () => {
	it('de-duplicates options and sorts them by label', () => {
		const { result } = renderHook(() =>
			useCityFilter([{ cities: [TOKYO, PRAGUE] }, { cities: [PRAGUE] }]),
		)

		expect(result.current.options).toEqual([
			{ id: PRAGUE.id, label: 'Prague, Czechia' },
			{ id: TOKYO.id, label: 'Tokyo, Japan' },
		])
	})

	it('labels legacy string ids via formatCity', () => {
		const { result } = renderHook(() =>
			useCityFilter([{ cities: ['tokyo'] }]),
		)

		expect(result.current.options).toEqual([
			{ id: 'tokyo', label: 'Tokyo, Japan' },
		])
	})

	it('ignores falsy city ids', () => {
		const { result } = renderHook(() =>
			useCityFilter([{ cities: [{ city: 'Nowhere' }, null, ''] }]),
		)

		expect(result.current.options).toEqual([])
	})

	it('has every city active by default', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		expect(result.current.inactiveIds).toEqual([])
		expect(result.current.filteredTravellers).toEqual(TRAVELLERS)
	})

	it('filters out travellers when a city is toggled off and restores on', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => result.current.toggleCity(PRAGUE.id, false))
		expect(result.current.inactiveIds).toEqual([PRAGUE.id])
		expect(result.current.filteredTravellers.map(({ id }) => id)).toEqual([
			'a',
			'c',
		])

		act(() => result.current.toggleCity(PRAGUE.id, true))
		expect(result.current.inactiveIds).toEqual([])
		expect(result.current.filteredTravellers).toEqual(TRAVELLERS)
	})

	it('does not add duplicate inactive ids', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => result.current.toggleCity(PRAGUE.id, false))
		act(() => result.current.toggleCity(PRAGUE.id, false))

		expect(result.current.inactiveIds).toEqual([PRAGUE.id])
	})

	it('returns an empty array when every city is toggled off', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => {
			result.current.options.forEach(({ id }) =>
				result.current.toggleCity(id, false),
			)
		})

		expect(result.current.filteredTravellers).toEqual([])
	})

	it('shows travellers without cities only when no filter is applied', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		expect(result.current.filteredTravellers).toContainEqual(TRAVELLERS[3])

		act(() => result.current.toggleCity('tokyo', false))

		expect(result.current.filteredTravellers).not.toContainEqual(
			TRAVELLERS[3],
		)
	})

	it.each([undefined, null])('handles %s travellers', (value) => {
		const { result } = renderHook(() => useCityFilter(value))

		expect(result.current.options).toEqual([])
		expect(result.current.filteredTravellers).toEqual([])
	})
})
