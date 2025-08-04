import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMobileMenu } from '../index'

describe('useMobileMenu', () => {
	let mockHamburgerRef
	let mockNavMenuRef
	let mockSetIsMenuOpen
	let mockHamburgerElement
	let mockNavMenuElement

	beforeEach(() => {
		mockHamburgerElement = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			contains: vi.fn(),
			classList: {
				toggle: vi.fn(),
			},
		}

		mockNavMenuElement = {
			classList: {
				toggle: vi.fn(),
			},
		}

		mockHamburgerRef = {
			current: mockHamburgerElement,
		}

		mockNavMenuRef = {
			current: mockNavMenuElement,
		}

		mockSetIsMenuOpen = vi.fn()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should not set up event listeners when user is not logged in', () => {
		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				false,
			),
		)

		expect(mockHamburgerElement.addEventListener).not.toHaveBeenCalled()
	})

	it('should set up event listeners when user is logged in', () => {
		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		expect(mockHamburgerElement.addEventListener).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
		)
	})

	it('should handle click on hamburger element', () => {
		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		const eventHandler =
			mockHamburgerElement.addEventListener.mock.calls[0][1]

		const mockEvent = {
			target: mockHamburgerElement,
		}

		eventHandler(mockEvent)

		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(expect.any(Function))
		expect(mockHamburgerElement.classList.toggle).toHaveBeenCalledWith(
			'active',
		)
		expect(mockNavMenuElement.classList.toggle).toHaveBeenCalledWith(
			'active',
		)
	})

	it('should handle click on child element of hamburger', () => {
		const mockChildElement = {}
		mockHamburgerElement.contains.mockReturnValue(true)

		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		const eventHandler =
			mockHamburgerElement.addEventListener.mock.calls[0][1]

		const mockEvent = {
			target: mockChildElement,
		}

		eventHandler(mockEvent)

		expect(mockHamburgerElement.contains).toHaveBeenCalledWith(
			mockChildElement,
		)
		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(expect.any(Function))
		expect(mockHamburgerElement.classList.toggle).toHaveBeenCalledWith(
			'active',
		)
		expect(mockNavMenuElement.classList.toggle).toHaveBeenCalledWith(
			'active',
		)
	})

	it('should not handle click on non-hamburger elements', () => {
		const mockOtherElement = {}
		mockHamburgerElement.contains.mockReturnValue(false)

		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		const eventHandler =
			mockHamburgerElement.addEventListener.mock.calls[0][1]

		const mockEvent = {
			target: mockOtherElement,
		}

		eventHandler(mockEvent)

		expect(mockHamburgerElement.contains).toHaveBeenCalledWith(
			mockOtherElement,
		)
		expect(mockSetIsMenuOpen).not.toHaveBeenCalled()
		expect(mockHamburgerElement.classList.toggle).not.toHaveBeenCalled()
		expect(mockNavMenuElement.classList.toggle).not.toHaveBeenCalled()
	})

	it('should toggle menu state correctly', () => {
		renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		const eventHandler =
			mockHamburgerElement.addEventListener.mock.calls[0][1]
		const mockEvent = {
			target: mockHamburgerElement,
		}

		eventHandler(mockEvent)

		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(expect.any(Function))

		const toggleFunction = mockSetIsMenuOpen.mock.calls[0][0]
		expect(toggleFunction(false)).toBe(true)
		expect(toggleFunction(true)).toBe(false)
	})

	it('should remove event listener on cleanup', () => {
		const { unmount } = renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				true,
			),
		)

		const eventHandler =
			mockHamburgerElement.addEventListener.mock.calls[0][1]

		unmount()

		expect(mockHamburgerElement.removeEventListener).toHaveBeenCalledWith(
			'click',
			eventHandler,
		)
	})

	it('should not remove event listener on cleanup when not logged in', () => {
		const { unmount } = renderHook(() =>
			useMobileMenu(
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
				false,
			),
		)

		unmount()

		expect(mockHamburgerElement.removeEventListener).not.toHaveBeenCalled()
	})

	it('should re-setup event listeners when isLoggedIn changes from false to true', () => {
		const { rerender } = renderHook(
			({ isLoggedIn }) =>
				useMobileMenu(
					mockHamburgerRef,
					mockNavMenuRef,
					mockSetIsMenuOpen,
					isLoggedIn,
				),
			{
				initialProps: { isLoggedIn: false },
			},
		)

		expect(mockHamburgerElement.addEventListener).not.toHaveBeenCalled()

		rerender({ isLoggedIn: true })

		expect(mockHamburgerElement.addEventListener).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
		)
	})
})
