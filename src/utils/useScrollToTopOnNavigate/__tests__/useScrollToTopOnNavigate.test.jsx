import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import useScrollToTopOnNavigate, {
	scrollToTop,
} from '@/utils/useScrollToTopOnNavigate'

const renderWithRouter = (initialEntry = '/travellers') =>
	renderHook(
		() => {
			useScrollToTopOnNavigate()
			return useNavigate()
		},
		{
			wrapper: ({ children }) => (
				<MemoryRouter initialEntries={[initialEntry]}>
					{children}
				</MemoryRouter>
			),
		},
	)

const mockReducedMotion = (matches) => {
	window.matchMedia = vi.fn().mockReturnValue({ matches })
}

describe('useScrollToTopOnNavigate', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn()
	})

	afterEach(() => {
		delete window.scrollTo
		delete window.matchMedia
	})

	it('scrolls to the top when the pathname changes', () => {
		const { result } = renderWithRouter()
		window.scrollTo.mockClear()

		act(() => result.current('/messages'))

		expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith(0, 0)
	})

	it('does not scroll when the new location has a hash', () => {
		const { result } = renderWithRouter()
		window.scrollTo.mockClear()

		act(() => result.current('/travellers/abc#photos'))

		expect(window.scrollTo).not.toHaveBeenCalled()
	})

	it('does not scroll on a navigation to the same pathname', () => {
		const { result } = renderWithRouter()
		window.scrollTo.mockClear()

		act(() => result.current('/travellers'))

		expect(window.scrollTo).not.toHaveBeenCalled()
	})
})

describe('scrollToTop', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn()
	})

	afterEach(() => {
		delete window.scrollTo
		delete window.matchMedia
	})

	it('scrolls smoothly when motion is allowed', () => {
		mockReducedMotion(false)
		scrollToTop()
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: 'smooth',
		})
	})

	it('jumps when the user prefers reduced motion', () => {
		mockReducedMotion(true)
		scrollToTop()
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: 'auto',
		})
	})

	it('scrolls smoothly where matchMedia is unavailable', () => {
		scrollToTop()
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: 'smooth',
		})
	})
})
