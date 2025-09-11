export const GLOBAL = Object.freeze({
	// ADMIN
	ADMIN_ID: import.meta.env.VITE_ADMIN_ID,

	// DIALOG
	ERROR_DIALOG_TITLE: 'An error occurred',
	AUTHENTICATING_DIALOG_TITLE: 'Authenticating...',

	// IMAGE UPLOAD
	LOADING_IMAGE: 'loading',

	// SPINNER
	LOADING_SPINNER_ALT: 'Loading content, please wait...',

	// BREAKPOINTS
	BREAKPOINT: {
		MOBILE: 768,
		TABLET: 1024,
		DESKTOP: 1200,
	},
})
