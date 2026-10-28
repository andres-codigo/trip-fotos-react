export const GLOBAL = Object.freeze({
	SITE_NAME: 'Trip Fotos',

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

	// CITY SEARCH
	CITY_SEARCH_TEXT: Object.freeze({
		LABEL: 'Cities visited',
		PLACEHOLDER: 'Start typing a city name',
		LOADING: 'Searching…',
		NO_RESULTS: 'No matching cities found.',
		ERROR: 'City search is unavailable. Please try again.',
		RESULTS: (count) =>
			`${count} ${count === 1 ? 'city' : 'cities'} found. Use the up and down arrow keys to choose one.`,
		SELECTED_LABEL: 'Selected cities',
	}),
	REMOVE_CITY_LABEL: (name) => `Remove ${name}`,

	// IMAGE
	IMAGE_UNAVAILABLE: 'Image unavailable',

	// UPLOAD PROGRESS
	UPLOAD_PROGRESS_LABEL: (uploadedFiles, totalFiles, percent) =>
		`Uploading photos: ${uploadedFiles} of ${totalFiles} done (${percent}%)`,

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
