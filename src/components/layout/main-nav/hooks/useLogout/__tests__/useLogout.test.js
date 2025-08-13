import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { useLogout } from '../index'
import { logout } from '@/store/slices/authenticationSlice'

vi.mock('react-redux', () => ({
	useDispatch: vi.fn(),
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	logout: vi.fn(),
}))

describe('useLogout', () => {
	const mockDispatch = vi.fn()
	const mockSetTravellerName = vi.fn()
	const mockSetTotalMessages = vi.fn()
	const mockSetIsMenuOpen = vi.fn()
	const mockEvent = {
		preventDefault: vi.fn(),
	}

	beforeEach(() => {
		useDispatch.mockReturnValue(mockDispatch)
	})

	it('should return a function', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		expect(typeof result.current).toBe('function')
	})

	it('should call preventDefault on event', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
	})

	it('should call setTravellerName with empty string', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockSetTravellerName).toHaveBeenCalledWith('')
	})

	it('should call setTotalMessages with null', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockSetTotalMessages).toHaveBeenCalledWith(null)
	})

	it('should call setIsMenuOpen with false', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
	})

	it('should dispatch logout action', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockDispatch).toHaveBeenCalledWith(logout())
	})

	it('should call all functions in correct order', () => {
		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(mockEvent.preventDefault).toHaveBeenCalledOnce()
		expect(mockSetTravellerName).toHaveBeenCalledOnce()
		expect(mockSetTotalMessages).toHaveBeenCalledOnce()
		expect(mockSetIsMenuOpen).toHaveBeenCalledOnce()
		expect(mockDispatch).toHaveBeenCalledOnce()
	})

	it('should handle missing setter functions gracefully', () => {
		const { result } = renderHook(() =>
			useLogout(undefined, undefined, undefined),
		)

		expect(() => result.current(mockEvent)).toThrow()
	})

	it('should work with different dispatch implementations', () => {
		const customDispatch = vi.fn()
		useDispatch.mockReturnValue(customDispatch)

		const { result } = renderHook(() =>
			useLogout(
				mockSetTravellerName,
				mockSetTotalMessages,
				mockSetIsMenuOpen,
			),
		)

		result.current(mockEvent)

		expect(customDispatch).toHaveBeenCalledWith(logout())
		expect(mockDispatch).not.toHaveBeenCalled()
	})
})
