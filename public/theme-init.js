// Runs before first paint so the page never flashes the wrong theme.
// Keep the storage key and attribute in step with src/constants/ui/theme.js.
;(function () {
	var mode = 'system'
	try {
		var stored = window.localStorage.getItem('trip-fotos-theme')
		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			mode = stored
		}
	} catch (e) {
		// Storage is blocked; follow the system setting
	}
	var dark =
		mode === 'dark' ||
		(mode === 'system' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches)
	var theme = dark ? 'dark' : 'light'
	var root = document.documentElement
	root.setAttribute('data-theme', theme)
	root.style.colorScheme = theme
	var meta = document.querySelector('meta[name="theme-color"]')
	if (meta) meta.setAttribute('content', dark ? '#141413' : '#faf9f5')
})()
