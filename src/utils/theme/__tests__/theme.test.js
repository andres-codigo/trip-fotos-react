import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { THEME } from '@/constants/ui'

import { createMemoryStorage } from '@/testUtils/vitest/memoryStorage'

import {
	applyTheme,
	getStoredThemeMode,
	resolveTheme,
	storeThemeMode,
} from '@/utils/theme'

const stubPrefersDark = (matches) =>
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockReturnValue({
			matches,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	)

describe('theme utils', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createMemoryStorage())
		document.documentElement.removeAttribute(THEME.ATTRIBUTE)
		document.documentElement.style.colorScheme = ''
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	describe('getStoredThemeMode', () => {
		it('defaults to system when nothing is stored', () => {
			expect(getStoredThemeMode()).toBe(THEME.MODES.SYSTEM)
		})

		it.each(Object.values(THEME.MODES))(
			'returns the stored %s mode',
			(mode) => {
				window.localStorage.setItem(THEME.STORAGE_KEY, mode)
				expect(getStoredThemeMode()).toBe(mode)
			},
		)

		it('ignores an unknown stored value', () => {
			window.localStorage.setItem(THEME.STORAGE_KEY, 'sepia')
			expect(getStoredThemeMode()).toBe(THEME.MODES.SYSTEM)
		})

		it('falls back to system when storage throws', () => {
			vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
				throw new Error('blocked')
			})
			expect(getStoredThemeMode()).toBe(THEME.MODES.SYSTEM)
		})
	})

	describe('storeThemeMode', () => {
		it('persists the mode', () => {
			storeThemeMode(THEME.MODES.DARK)
			expect(window.localStorage.getItem(THEME.STORAGE_KEY)).toBe('dark')
		})

		it('does not throw when storage is blocked', () => {
			vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
				throw new Error('blocked')
			})
			expect(() => storeThemeMode(THEME.MODES.DARK)).not.toThrow()
		})
	})

	describe('resolveTheme', () => {
		it('returns explicit modes unchanged', () => {
			stubPrefersDark(true)
			expect(resolveTheme(THEME.MODES.LIGHT)).toBe('light')
			stubPrefersDark(false)
			expect(resolveTheme(THEME.MODES.DARK)).toBe('dark')
		})

		it.each([
			[true, 'dark'],
			[false, 'light'],
		])(
			'follows the system when it prefers dark = %s',
			(matches, expected) => {
				stubPrefersDark(matches)
				expect(resolveTheme(THEME.MODES.SYSTEM)).toBe(expected)
			},
		)

		it('treats a missing matchMedia as light', () => {
			vi.stubGlobal('matchMedia', undefined)
			expect(resolveTheme(THEME.MODES.SYSTEM)).toBe('light')
		})
	})

	describe('applyTheme', () => {
		it('sets the attribute, colour scheme and theme-color meta', () => {
			const meta = document.createElement('meta')
			meta.setAttribute('name', 'theme-color')
			document.head.appendChild(meta)

			applyTheme(THEME.MODES.DARK)

			expect(document.documentElement).toHaveAttribute(
				THEME.ATTRIBUTE,
				'dark',
			)
			expect(document.documentElement.style.colorScheme).toBe('dark')
			expect(meta).toHaveAttribute(
				'content',
				THEME.META_THEME_COLOUR.dark,
			)
			meta.remove()
		})

		it('resolves system through the media query', () => {
			stubPrefersDark(true)
			expect(applyTheme(THEME.MODES.SYSTEM)).toBe('dark')
			expect(document.documentElement).toHaveAttribute(
				THEME.ATTRIBUTE,
				'dark',
			)
		})
	})
})
