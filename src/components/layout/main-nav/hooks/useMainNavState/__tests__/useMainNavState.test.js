import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import useMainNavState from '@/components/layout/main-nav/hooks/useMainNavState'
import useLoggedInTravellerName from '@/components/layout/main-nav/hooks/useLoggedInTravellerName'

vi.mock('@/components/layout/main-nav/hooks/useLoggedInTravellerName', () => ({
	default: vi.fn(),
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
		expect(result.current).toHaveProperty('isMenuOpen')
		expect(result.current).toHaveProperty('setIsMenuOpen')
	})

	it('should return correct initial values', () => {
		const { result } = renderHook(() => useMainNavState())

		expect(result.current.travellerName).toBe('John Doe')
		expect(result.current.isMenuOpen).toBe(false)
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
			result.current.setIsMenuOpen(true)
		})

		expect(result.current.isMenuOpen).toBe(true)
		expect(result.current.travellerName).toBe('John Doe')
	})
})
