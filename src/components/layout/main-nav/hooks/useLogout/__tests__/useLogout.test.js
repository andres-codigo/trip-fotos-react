import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDispatch } from 'react-redux'

import useLogout from '@/components/layout/main-nav/hooks/useLogout'
import { logout } from '@/store/slices/authenticationSlice'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('@/store/slices/authenticationSlice', () => ({
	logout: vi.fn(),
}))

describe('useLogout', () => {
	const mockDispatch = vi.fn()
	const mockSetTravellerName = vi.fn()
	const mockSetIsMenuOpen = vi.fn()
	const mockEvent = {
		preventDefault: vi.fn(),
	}

	beforeEach(() => {
		useDispatch.mockReturnValue(mockDispatch)
	})

	it('should return a function', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		expect(typeof result.current).toBe('function')
	})

	it('should call preventDefault on event', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
	})

	it('should call setTravellerName with empty string', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(mockSetTravellerName).toHaveBeenCalledWith('')
	})

	it('should call setIsMenuOpen with false', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
	})

	it('should dispatch logout action', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(mockDispatch).toHaveBeenCalledWith(logout())
	})

	it('should call all functions in correct order', () => {
		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
		expect(mockSetTravellerName).toHaveBeenCalledOnce()
		expect(mockSetIsMenuOpen).toHaveBeenCalledOnce()
		expect(mockDispatch).toHaveBeenCalledOnce()
	})

	it('should handle missing setter functions gracefully', () => {
		const { result } = renderHook(() => useLogout(undefined, undefined))

		expect(() => result.current(mockEvent)).toThrow()
	})

	it('should work with different dispatch implementations', () => {
		const customDispatch = vi.fn()
		useDispatch.mockReturnValue(customDispatch)

		const { result } = renderHook(() =>
			useLogout(mockSetTravellerName, mockSetIsMenuOpen),
		)

		result.current(mockEvent)

		expect(customDispatch).toHaveBeenCalledWith(logout())
		expect(mockDispatch).not.toHaveBeenCalled()
	})
})
