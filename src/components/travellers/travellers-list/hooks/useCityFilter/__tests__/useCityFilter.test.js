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

const ids = (travellers) => travellers.map(({ id }) => id)

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
			useCityFilter([{ cities: ['tokyo', 'krakow'] }]),
		)

		expect(result.current.options).toEqual([
			{ id: 'krakow', label: 'Krakow' },
			{ id: 'tokyo', label: 'Tokyo, Japan' },
		])
	})

	it('ignores falsy city ids', () => {
		const { result } = renderHook(() =>
			useCityFilter([{ cities: [{ city: 'Nowhere' }, null, ''] }]),
		)

		expect(result.current.options).toEqual([])
	})

	it('shows every traveller with nothing ticked', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		expect(result.current.selectedIds).toEqual([])
		expect(result.current.isFiltered).toBe(false)
		expect(result.current.filteredTravellers).toEqual(TRAVELLERS)
	})

	it('narrows to travellers who visited a ticked city, and widens again on untick', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => result.current.toggleCity(PRAGUE.id, true))
		expect(result.current.selectedIds).toEqual([PRAGUE.id])
		expect(result.current.isFiltered).toBe(true)
		expect(ids(result.current.filteredTravellers)).toEqual(['a', 'b'])

		act(() => result.current.toggleCity('tokyo', true))
		expect(ids(result.current.filteredTravellers)).toEqual(['a', 'b', 'c'])

		act(() => result.current.toggleCity(PRAGUE.id, false))
		expect(ids(result.current.filteredTravellers)).toEqual(['c'])
	})

	it('does not add a ticked city twice', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => result.current.toggleCity(PRAGUE.id, true))
		act(() => result.current.toggleCity(PRAGUE.id, true))

		expect(result.current.selectedIds).toEqual([PRAGUE.id])
	})

	it('hides travellers without cities only while narrowed', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => result.current.toggleCity('tokyo', true))
		expect(result.current.filteredTravellers).not.toContainEqual(
			TRAVELLERS[3],
		)

		act(() => result.current.showAllCities())
		expect(result.current.filteredTravellers).toContainEqual(TRAVELLERS[3])
	})

	it('shows all cities again after Show all cities', () => {
		const { result } = renderHook(() => useCityFilter(TRAVELLERS))

		act(() => {
			result.current.toggleCity(PRAGUE.id, true)
			result.current.toggleCity('tokyo', true)
		})
		act(() => result.current.showAllCities())

		expect(result.current.selectedIds).toEqual([])
		expect(result.current.filteredTravellers).toEqual(TRAVELLERS)
	})

	it('drops the tick of a city whose last traveller has gone, so the list never empties', () => {
		const { result, rerender } = renderHook(
			({ travellers }) => useCityFilter(travellers),
			{ initialProps: { travellers: TRAVELLERS } },
		)

		act(() => result.current.toggleCity('tokyo', true))
		expect(ids(result.current.filteredTravellers)).toEqual(['c'])

		const withoutC = TRAVELLERS.filter(({ id }) => id !== 'c')
		rerender({ travellers: withoutC })

		expect(result.current.selectedIds).toEqual([])
		expect(result.current.isFiltered).toBe(false)
		expect(result.current.filteredTravellers).toEqual(withoutC)
	})

	it.each([undefined, null])('handles %s travellers', (value) => {
		const { result } = renderHook(() => useCityFilter(value))

		expect(result.current.options).toEqual([])
		expect(result.current.filteredTravellers).toEqual([])
	})
})
