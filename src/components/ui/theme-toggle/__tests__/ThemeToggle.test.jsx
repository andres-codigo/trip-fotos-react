import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { THEME } from '@/constants/ui'

import { createMemoryStorage } from '@/testUtils/vitest/memoryStorage'

import ThemeToggle from '@/components/ui/theme-toggle/ThemeToggle'

vi.mock('@/components/ui/theme-toggle/ThemeToggle.module.scss', () => ({
	default: {},
}))

const mockSystemScheme = (matches) => {
	const listeners = new Set()
	const query = {
		matches,
		addEventListener: (_, listener) => listeners.add(listener),
		removeEventListener: (_, listener) => listeners.delete(listener),
	}
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(query))
	return {
		change: (next) => {
			query.matches = next
			listeners.forEach((listener) => listener())
		},
		listenerCount: () => listeners.size,
	}
}

const root = () => document.documentElement.getAttribute(THEME.ATTRIBUTE)

describe('<ThemeToggle />', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createMemoryStorage())
		document.documentElement.removeAttribute(THEME.ATTRIBUTE)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('offers Light, Dark and System in a named group', () => {
		mockSystemScheme(false)
		render(<ThemeToggle />)

		expect(
			screen.getByRole('group', { name: THEME.TOGGLE_LABEL }),
		).toBeInTheDocument()
		expect(screen.getAllByRole('radio')).toHaveLength(3)
		THEME.OPTIONS.forEach(({ label }) =>
			expect(screen.getByLabelText(label)).toBeInTheDocument(),
		)
	})

	it('starts on System and applies the system scheme', () => {
		mockSystemScheme(true)
		render(<ThemeToggle />)

		expect(screen.getByLabelText('System')).toBeChecked()
		expect(root()).toBe('dark')
	})

	it('restores the stored choice', () => {
		mockSystemScheme(false)
		window.localStorage.setItem(THEME.STORAGE_KEY, THEME.MODES.DARK)
		render(<ThemeToggle />)

		expect(screen.getByLabelText('Dark')).toBeChecked()
		expect(root()).toBe('dark')
	})

	it('applies and stores the chosen mode', () => {
		mockSystemScheme(false)
		render(<ThemeToggle />)

		fireEvent.click(screen.getByLabelText('Dark'))

		expect(screen.getByLabelText('Dark')).toBeChecked()
		expect(root()).toBe('dark')
		expect(window.localStorage.getItem(THEME.STORAGE_KEY)).toBe('dark')

		fireEvent.click(screen.getByLabelText('Light'))
		expect(root()).toBe('light')
		expect(window.localStorage.getItem(THEME.STORAGE_KEY)).toBe('light')
	})

	it('follows system changes only while System is selected', () => {
		const system = mockSystemScheme(false)
		render(<ThemeToggle />)
		expect(root()).toBe('light')

		system.change(true)
		expect(root()).toBe('dark')

		fireEvent.click(screen.getByLabelText('Light'))
		expect(system.listenerCount()).toBe(0)
		system.change(true)
		expect(root()).toBe('light')
	})

	it('stops listening to the system on unmount', () => {
		const system = mockSystemScheme(false)
		const { unmount } = render(<ThemeToggle />)
		expect(system.listenerCount()).toBe(1)

		unmount()
		expect(system.listenerCount()).toBe(0)
	})

	it('syncs a choice made in another tab', () => {
		mockSystemScheme(false)
		render(<ThemeToggle />)

		window.localStorage.setItem(THEME.STORAGE_KEY, THEME.MODES.DARK)
		fireEvent(
			window,
			new StorageEvent('storage', { key: THEME.STORAGE_KEY }),
		)

		expect(screen.getByLabelText('Dark')).toBeChecked()
		expect(root()).toBe('dark')
	})

	it('ignores storage events for other keys', () => {
		mockSystemScheme(false)
		render(<ThemeToggle />)

		fireEvent(window, new StorageEvent('storage', { key: 'other' }))

		expect(screen.getByLabelText('System')).toBeChecked()
	})

	it('works when matchMedia is unavailable', () => {
		vi.stubGlobal('matchMedia', undefined)
		render(<ThemeToggle />)

		expect(root()).toBe('light')
	})
})
