import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import useViewport from '@/utils/useViewport/index'

import { TEST_WIDTHS, DEBOUNCE_DELAYS } from './viewportTestData.js'

const mockWindow = (width) => {
	Object.defineProperty(window, 'innerWidth', {
		writable: true,
		configurable: true,
		value: width,
	})
}

describe('useViewport', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it.each([
		[
			'MOBILE_SMALL',
			'mobile',
			TEST_WIDTHS.MOBILE_SMALL,
			true,
			false,
			false,
		],
		['MOBILE_EDGE', 'mobile', TEST_WIDTHS.MOBILE_EDGE, true, false, false],
		[
			'TABLET_SMALL',
			'tablet',
			TEST_WIDTHS.TABLET_SMALL,
			false,
			true,
			false,
		],
		['TABLET_EDGE', 'desktop', TEST_WIDTHS.TABLET_EDGE, false, false, true],
		[
			'DESKTOP_LARGE',
			'desktop',
			TEST_WIDTHS.DESKTOP_LARGE,
			false,
			false,
			true,
		],
	])('reports %s as %s', (_, __, width, isMobile, isTablet, isDesktop) => {
		mockWindow(width)
		const { result } = renderHook(() => useViewport())

		expect(result.current).toEqual({ isMobile, isTablet, isDesktop, width })
	})

	it('should debounce resize events', () => {
		mockWindow(TEST_WIDTHS.DESKTOP_LARGE)
		const { result } = renderHook(() => useViewport(DEBOUNCE_DELAYS.SHORT))

		act(() => {
			mockWindow(TEST_WIDTHS.MOBILE_SMALL)
			window.dispatchEvent(new Event('resize'))
		})

		expect(result.current.width).toBe(TEST_WIDTHS.DESKTOP_LARGE)

		act(() => {
			vi.advanceTimersByTime(DEBOUNCE_DELAYS.SHORT)
		})

		expect(result.current.width).toBe(TEST_WIDTHS.MOBILE_SMALL)
		expect(result.current.isMobile).toBe(true)
	})

	it('should use custom debounce delay', () => {
		mockWindow(TEST_WIDTHS.DESKTOP_SMALL)
		const { result } = renderHook(() => useViewport(DEBOUNCE_DELAYS.LONG))

		act(() => {
			mockWindow(400)
			window.dispatchEvent(new Event('resize'))
		})

		act(() => {
			vi.advanceTimersByTime(DEBOUNCE_DELAYS.SHORT)
		})
		expect(result.current.width).toBe(TEST_WIDTHS.DESKTOP_SMALL)

		act(() => {
			vi.advanceTimersByTime(DEBOUNCE_DELAYS.MEDIUM)
		})
		expect(result.current.width).toBe(400)
	})

	it('should cleanup event listeners on unmount', () => {
		const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
		const { unmount } = renderHook(() => useViewport())

		unmount()

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			'resize',
			expect.any(Function),
		)
	})
})
