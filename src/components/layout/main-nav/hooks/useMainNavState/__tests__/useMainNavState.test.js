import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMainNavState } from '../index'
import { useLoggedInTravellerName } from '../../useLoggedInTravellerName/index'

vi.mock('../../useLoggedInTravellerName/index', () => ({
	useLoggedInTravellerName: vi.fn(),
}))

describe('useMainNavState', () => {
	const mockSetTravellerName = vi.fn()

	beforeEach(() => {
		useLoggedInTravellerName.mockReturnValue([
			'John Doe',
			mockSetTravellerName,
		])
	})

	it('should return initial state with correct structure', () => {
		const { result } = renderHook(() => useMainNavState())

		expect(result.current).toHaveProperty('travellerName')
		expect(result.current).toHaveProperty('setTravellerName')
		expect(result.current).toHaveProperty('totalMessages')
		expect(result.current).toHaveProperty('setTotalMessages')
		expect(result.current).toHaveProperty('isMenuOpen')
		expect(result.current).toHaveProperty('setIsMenuOpen')
	})

	it('should return correct initial values', () => {
		const { result } = renderHook(() => useMainNavState())

		expect(result.current.travellerName).toBe('John Doe')
		expect(result.current.totalMessages).toBe(null)
		expect(result.current.isMenuOpen).toBe(false)
	})

	it('should update totalMessages when setTotalMessages is called', () => {
		const { result } = renderHook(() => useMainNavState())

		act(() => {
			result.current.setTotalMessages(5)
		})

		expect(result.current.totalMessages).toBe(5)
	})

	it('should update isMenuOpen when setIsMenuOpen is called', () => {
		const { result } = renderHook(() => useMainNavState())

		act(() => {
			result.current.setIsMenuOpen(true)
		})

		expect(result.current.isMenuOpen).toBe(true)
	})

	it('should call setTravellerName from useLoggedInTravellerName', () => {
		const { result } = renderHook(() => useMainNavState())

		act(() => {
			result.current.setTravellerName('Jane Doe')
		})

		expect(mockSetTravellerName).toHaveBeenCalledWith('Jane Doe')
	})

	it('should handle multiple state updates correctly', () => {
		const { result } = renderHook(() => useMainNavState())

		act(() => {
			result.current.setTotalMessages(10)
			result.current.setIsMenuOpen(true)
		})

		expect(result.current.totalMessages).toBe(10)
		expect(result.current.isMenuOpen).toBe(true)
		expect(result.current.travellerName).toBe('John Doe')
	})
})
