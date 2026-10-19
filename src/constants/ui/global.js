export const GLOBAL = Object.freeze({
	SITE_NAME: 'Trip Fotos',

	// ADMIN
	ADMIN_ID: import.meta.env.VITE_ADMIN_ID,

	// DIALOG
	ERROR_DIALOG_TITLE: 'An error occurred',
	AUTHENTICATING_DIALOG_TITLE: 'Authenticating...',

	// IMAGE UPLOAD
	LOADING_IMAGE: 'loading',
	FILE_STATUS: Object.freeze({
		LOADING: 'loading',
		UPLOADED: 'uploaded',
		ERROR: 'error',
	}),
	FILE_STATUS_LABEL: Object.freeze({
		loading: 'In progress',
		uploaded: 'Uploaded',
		error: 'Error',
	}),
	REMOVE_FILE_LABEL: (name) => `Remove ${name}`,
	FILE_DROP_TEXT: Object.freeze({
		ACTIVE: 'Drop your files here',
		ACTIVE_HINT: 'to add them',
		IDLE: 'Drag and drop your files here',
		IDLE_HINT_PREFIX: 'or',
		IDLE_HINT_ACTION: 'click here',
		IDLE_HINT_SUFFIX: 'to select your files',
	}),
	FILE_LIST_LABEL: 'Selected files',

	// IMAGE
	IMAGE_UNAVAILABLE: 'Image unavailable',

	// SPINNER
	LOADING_SPINNER_ALT: 'Loading content, please wait...',

	// BREAKPOINTS
	BREAKPOINT: {
		MOBILE: 768,
		TABLET: 1024,
		DESKTOP: 1200,
	},

	// CLASSES
	CLASS_NAMES: {
		MAIN_CONTAINER: 'mainContainer',
	},
})
