// storageKey and the data-theme attribute are duplicated in public/theme-init.js, which runs before the bundle
export const THEME = Object.freeze({
	STORAGE_KEY: 'trip-fotos-theme',
	ATTRIBUTE: 'data-theme',
	DARK_QUERY: '(prefers-color-scheme: dark)',
	MODES: Object.freeze({
		LIGHT: 'light',
		DARK: 'dark',
		SYSTEM: 'system',
	}),
	RESOLVED: Object.freeze({
		LIGHT: 'light',
		DARK: 'dark',
	}),
	META_THEME_COLOUR: Object.freeze({
		light: '#faf9f5',
		dark: '#141413',
	}),
	TOGGLE_LABEL: 'Theme',
	OPTIONS: Object.freeze([
		Object.freeze({ mode: 'light', label: 'Light' }),
		Object.freeze({ mode: 'dark', label: 'Dark' }),
		Object.freeze({ mode: 'system', label: 'System' }),
	]),
})
