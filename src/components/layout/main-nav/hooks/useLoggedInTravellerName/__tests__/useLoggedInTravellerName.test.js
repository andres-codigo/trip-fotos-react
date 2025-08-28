import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { useLoggedInTravellerName } from '../index'

const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
}

const addEventListenerSpy = vi.fn()
const removeEventListenerSpy = vi.fn()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

Object.defineProperty(window, 'addEventListener', {
	value: addEventListenerSpy,
})

Object.defineProperty(window, 'removeEventListener', {
	value: removeEventListenerSpy,
})

describe('useLoggedInTravellerName', () => {
	it('should initialize with localStorage value when available', () => {
		localStorageMock.getItem.mockReturnValue('John Doe')

		const { result } = renderHook(() => useLoggedInTravellerName())

		expect(result.current[0]).toBe('John Doe')
		expect(localStorageMock.getItem).toHaveBeenCalledWith('userName')
	})

	it('should initialize with empty string when localStorage is empty', () => {
		localStorageMock.getItem.mockReturnValue(null)

		const { result } = renderHook(() => useLoggedInTravellerName())

		expect(result.current[0]).toBe('')
		expect(localStorageMock.getItem).toHaveBeenCalledWith('userName')
	})

	it('should sync traveller name from localStorage on mount', () => {
		localStorageMock.getItem
			.mockReturnValueOnce('Initial')
			.mockReturnValueOnce('Updated')

		const { result } = renderHook(() => useLoggedInTravellerName())

		expect(result.current[0]).toBe('Updated')
		expect(localStorageMock.getItem).toHaveBeenCalledTimes(2)
	})

	it('should add storage event listener on mount', () => {
		renderHook(() => useLoggedInTravellerName())

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'storage',
			expect.any(Function),
		)
	})

	it('should remove storage event listener on unmount', () => {
		const { unmount } = renderHook(() => useLoggedInTravellerName())

		unmount()

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			'storage',
			expect.any(Function),
		)
	})

	it('should update traveller name when storage event is triggered', () => {
		localStorageMock.getItem
			.mockReturnValueOnce('Initial')
			.mockReturnValueOnce('Initial')
			.mockReturnValueOnce('Updated from storage')

		const { result } = renderHook(() => useLoggedInTravellerName())

		const storageHandler = addEventListenerSpy.mock.calls[0][1]

		act(() => {
			storageHandler()
		})

		expect(result.current[0]).toBe('Updated from storage')
	})

	it('should handle null localStorage value in storage event', () => {
		localStorageMock.getItem
			.mockReturnValueOnce('Initial')
			.mockReturnValueOnce('Initial')
			.mockReturnValueOnce(null)

		const { result } = renderHook(() => useLoggedInTravellerName())

		const storageHandler = addEventListenerSpy.mock.calls[0][1]

		act(() => {
			storageHandler()
		})

		expect(result.current[0]).toBe('')
	})

	it('should return setter function that updates state', () => {
		localStorageMock.getItem.mockReturnValue('Initial')

		const { result } = renderHook(() => useLoggedInTravellerName())

		act(() => {
			result.current[1]('New Name')
		})

		expect(result.current[0]).toBe('New Name')
	})

	it('should return stable setter function reference', () => {
		const { result, rerender } = renderHook(() =>
			useLoggedInTravellerName(),
		)

		const firstSetter = result.current[1]
		rerender()
		const secondSetter = result.current[1]

		expect(firstSetter).toBe(secondSetter)
	})

	it('should handle undefined localStorage value', () => {
		localStorageMock.getItem.mockReturnValue(undefined)

		const { result } = renderHook(() => useLoggedInTravellerName())

		expect(result.current[0]).toBe('')
	})
})
