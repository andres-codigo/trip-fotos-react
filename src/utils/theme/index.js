import { THEME } from '@/constants/ui'

const isMode = (value) => Object.values(THEME.MODES).includes(value)

const prefersDark = () =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia(THEME.DARK_QUERY).matches

// Storage throws in some private windows and when site data is blocked
export const getStoredThemeMode = () => {
	try {
		const stored = window.localStorage.getItem(THEME.STORAGE_KEY)
		return isMode(stored) ? stored : THEME.MODES.SYSTEM
	} catch {
		return THEME.MODES.SYSTEM
	}
}

export const storeThemeMode = (mode) => {
	try {
		window.localStorage.setItem(THEME.STORAGE_KEY, mode)
	} catch {
		// The choice still applies for this visit
	}
}

export const resolveTheme = (mode) => {
	if (mode === THEME.MODES.LIGHT) return THEME.RESOLVED.LIGHT
	if (mode === THEME.MODES.DARK) return THEME.RESOLVED.DARK
	return prefersDark() ? THEME.RESOLVED.DARK : THEME.RESOLVED.LIGHT
}

export const applyTheme = (mode) => {
	const resolved = resolveTheme(mode)
	const root = document.documentElement
	root.setAttribute(THEME.ATTRIBUTE, resolved)
	root.style.colorScheme = resolved
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute('content', THEME.META_THEME_COLOUR[resolved])
	return resolved
}
