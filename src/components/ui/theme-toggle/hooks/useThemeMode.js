import { useCallback, useEffect, useState } from 'react'

import { THEME } from '@/constants/ui'

import { applyTheme, getStoredThemeMode, storeThemeMode } from '@/utils/theme'

const useThemeMode = () => {
	const [mode, setModeState] = useState(getStoredThemeMode)

	useEffect(() => {
		applyTheme(mode)
		if (
			mode !== THEME.MODES.SYSTEM ||
			typeof window.matchMedia !== 'function'
		) {
			return undefined
		}

		const query = window.matchMedia(THEME.DARK_QUERY)
		const handleChange = () => applyTheme(THEME.MODES.SYSTEM)
		query.addEventListener('change', handleChange)
		return () => query.removeEventListener('change', handleChange)
	}, [mode])

	// Keeps several open tabs in step
	useEffect(() => {
		const handleStorage = (event) => {
			if (event.key === THEME.STORAGE_KEY) {
				setModeState(getStoredThemeMode())
			}
		}
		window.addEventListener('storage', handleStorage)
		return () => window.removeEventListener('storage', handleStorage)
	}, [])

	const setMode = useCallback((next) => {
		storeThemeMode(next)
		setModeState(next)
	}, [])

	return { mode, setMode }
}

export default useThemeMode
