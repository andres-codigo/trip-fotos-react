import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { PATHS } from '@/constants/ui'

import useLogout from '@/components/layout/main-nav/hooks/useLogout'
import { logout } from '@/store/slices/authenticationSlice'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('react-router-dom', () => ({
	useNavigate: vi.fn(),
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	logout: vi.fn(() => ({ type: 'authentication/logout' })),
}))

describe('useLogout', () => {
	const mockDispatch = vi.fn()
	const mockNavigate = vi.fn()
	const mockSetTravellerName = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		useDispatch.mockReturnValue(mockDispatch)
		useNavigate.mockReturnValue(mockNavigate)
	})

	it('clears the name, dispatches logout and goes to the log in page', () => {
		const { result } = renderHook(() => useLogout(mockSetTravellerName))

		result.current()

		expect(mockSetTravellerName).toHaveBeenCalledWith('')
		expect(mockDispatch).toHaveBeenCalledWith(logout())
		expect(mockNavigate).toHaveBeenCalledWith(PATHS.AUTHENTICATION)
	})

	it('dispatches logout before navigating', () => {
		const { result } = renderHook(() => useLogout(mockSetTravellerName))

		result.current()

		expect(mockDispatch.mock.invocationCallOrder[0]).toBeLessThan(
			mockNavigate.mock.invocationCallOrder[0],
		)
	})
})
