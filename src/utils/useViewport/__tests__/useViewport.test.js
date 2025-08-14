import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import useViewport from '../index'

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

	it('should return mobile viewport for small screens', () => {
		mockWindow(TEST_WIDTHS.MOBILE_SMALL)
		const { result } = renderHook(() => useViewport())

		expect(result.current.isMobile).toBe(true)
		expect(result.current.isTablet).toBe(false)
		expect(result.current.isDesktop).toBe(false)
	})

	it('should return tablet viewport for medium screens', () => {
		mockWindow(TEST_WIDTHS.TABLET_SMALL)
		const { result } = renderHook(() => useViewport())

		expect(result.current.isMobile).toBe(false)
		expect(result.current.isTablet).toBe(true)
		expect(result.current.isDesktop).toBe(false)
	})
	it('should return desktop viewport for large screens', () => {
		mockWindow(TEST_WIDTHS.DESKTOP_LARGE)
		const { result } = renderHook(() => useViewport())

		expect(result.current).toEqual({
			isMobile: false,
			isTablet: false,
			isDesktop: true,
			width: TEST_WIDTHS.DESKTOP_LARGE,
		})
	})

	it('should handle edge case screen sizes correctly', () => {
		mockWindow(TEST_WIDTHS.MOBILE_EDGE)
		const { result: mobileResult } = renderHook(() => useViewport())
		expect(mobileResult.current.isMobile).toBe(true)
		expect(mobileResult.current.isTablet).toBe(false)
		expect(mobileResult.current.isDesktop).toBe(false)

		mockWindow(TEST_WIDTHS.TABLET_SMALL)
		const { result: tabletResult } = renderHook(() => useViewport())
		expect(tabletResult.current.isMobile).toBe(false)
		expect(tabletResult.current.isTablet).toBe(true)
		expect(tabletResult.current.isDesktop).toBe(false)

		mockWindow(TEST_WIDTHS.TABLET_EDGE)
		const { result: desktopResult } = renderHook(() => useViewport())
		expect(desktopResult.current.isMobile).toBe(false)
		expect(desktopResult.current.isTablet).toBe(false)
		expect(desktopResult.current.isDesktop).toBe(true)
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
