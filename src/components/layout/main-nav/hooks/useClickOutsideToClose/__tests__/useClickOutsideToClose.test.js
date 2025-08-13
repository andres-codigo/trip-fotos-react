import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { GLOBAL } from '@/constants/global'

import { useClickOutsideToClose } from '../index'

const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(document, 'addEventListener', {
	value: mockAddEventListener,
	writable: true,
})

Object.defineProperty(document, 'removeEventListener', {
	value: mockRemoveEventListener,
	writable: true,
})

describe('useClickOutsideToClose', () => {
	let mockSetIsMenuOpen
	let mockHamburgerRef
	let mockNavMenuRef
	let mockEvent

	beforeEach(() => {
		mockSetIsMenuOpen = vi.fn()
		mockHamburgerRef = {
			current: {
				contains: vi.fn(() => false),
			},
		}
		mockNavMenuRef = {
			current: {
				contains: vi.fn(() => false),
			},
		}
		mockEvent = {
			target: document.createElement('div'),
		}

		Object.defineProperty(document.documentElement, 'clientWidth', {
			value: GLOBAL.BREAKPOINT.MOBILE,
			writable: true,
		})
	})

	it('should add click event listener on mount', () => {
		renderHook(() =>
			useClickOutsideToClose(
				true,
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
			),
		)

		expect(mockAddEventListener).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
		)
	})

	it('should remove click event listener on unmount', () => {
		const { unmount } = renderHook(() =>
			useClickOutsideToClose(
				true,
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
			),
		)

		unmount()

		expect(mockRemoveEventListener).toHaveBeenCalledWith(
			'click',
			expect.any(Function),
		)
	})

	it('should close menu when clicking outside on mobile and menu is open', () => {
		document.documentElement.clientWidth = GLOBAL.BREAKPOINT.MOBILE

		renderHook(() =>
			useClickOutsideToClose(
				true,
				mockHamburgerRef,
				mockNavMenuRef,
				mockSetIsMenuOpen,
			),
		)

		const eventHandler = mockAddEventListener.mock.calls[0][1]

		eventHandler(mockEvent)

		expect(mockSetIsMenuOpen).toHaveBeenCalledWith(false)
	})
})
