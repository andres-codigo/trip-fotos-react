import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { CITY_SEARCH } from '@/constants/api'

import useCitySearch, {
	CITY_SEARCH_STATUS,
} from '@/components/forms/traveller-registration/hooks/useCitySearch'

import {
	PHOTON_RESPONSE,
	SYDNEY_NSW,
} from '@/components/forms/traveller-registration/hooks/useCitySearch/__tests__/citySearchTestData'

const respond = (body, ok = true) =>
	fetch.mockResolvedValueOnce({
		ok,
		status: ok ? 200 : 500,
		json: async () => body,
	})

const flushDebounce = async () => {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(CITY_SEARCH.DEBOUNCE_MS)
	})
}

describe('useCitySearch', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		fetch.mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('stays idle and does not fetch below the minimum characters', async () => {
		const { result } = renderHook(() => useCitySearch('s'))
		await flushDebounce()

		expect(result.current).toEqual({
			results: [],
			status: CITY_SEARCH_STATUS.IDLE,
		})
		expect(fetch).not.toHaveBeenCalled()
	})

	it('reports loading straight away, then fetches once after the debounce', async () => {
		respond(PHOTON_RESPONSE)
		const { result } = renderHook(() => useCitySearch(' syd '))

		expect(result.current.status).toBe(CITY_SEARCH_STATUS.LOADING)
		expect(fetch).not.toHaveBeenCalled()

		await flushDebounce()

		expect(fetch).toHaveBeenCalledTimes(1)
		const [url] = fetch.mock.calls[0]
		expect(url).toContain(CITY_SEARCH.URL)
		expect(url).toContain('q=syd')
		expect(url).toContain(`layer=${CITY_SEARCH.LAYER}`)
	})

	it('maps, de-duplicates and filters incomplete results', async () => {
		respond(PHOTON_RESPONSE)
		const { result } = renderHook(() => useCitySearch('syd'))
		await flushDebounce()

		expect(result.current.status).toBe(CITY_SEARCH_STATUS.SUCCESS)
		expect(result.current.results).toEqual([
			SYDNEY_NSW,
			{
				id: 'N1234',
				city: 'Sydney',
				region: 'Nova Scotia',
				country: 'Canada',
			},
		])
	})

	it('only fetches the latest term when typing quickly', async () => {
		respond(PHOTON_RESPONSE)
		const { rerender } = renderHook(({ q }) => useCitySearch(q), {
			initialProps: { q: 'sy' },
		})

		rerender({ q: 'syd' })
		await flushDebounce()

		expect(fetch).toHaveBeenCalledTimes(1)
		expect(fetch.mock.calls[0][0]).toContain('q=syd')
	})

	it('hides results from a previous term', async () => {
		respond(PHOTON_RESPONSE)
		const { result, rerender } = renderHook(({ q }) => useCitySearch(q), {
			initialProps: { q: 'syd' },
		})
		await flushDebounce()

		rerender({ q: 'sydn' })

		expect(result.current).toEqual({
			results: [],
			status: CITY_SEARCH_STATUS.LOADING,
		})
	})

	it('reports an error for a failed response', async () => {
		respond({}, false)
		const { result } = renderHook(() => useCitySearch('syd'))
		await flushDebounce()

		expect(result.current.status).toBe(CITY_SEARCH_STATUS.ERROR)
		expect(result.current.results).toEqual([])
	})

	it('reports an error when the request fails', async () => {
		fetch.mockRejectedValueOnce(new Error('offline'))
		const { result } = renderHook(() => useCitySearch('syd'))
		await flushDebounce()

		expect(result.current.status).toBe(CITY_SEARCH_STATUS.ERROR)
	})

	it('aborts the request on unmount', async () => {
		let signal
		fetch.mockImplementationOnce((_, options) => {
			signal = options.signal
			return new Promise(() => {})
		})
		const { unmount } = renderHook(() => useCitySearch('syd'))
		await flushDebounce()

		unmount()

		expect(signal.aborted).toBe(true)
	})
})
