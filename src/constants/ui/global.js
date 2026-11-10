export const GLOBAL = Object.freeze({
	SITE_NAME: 'Trip Fotos',

	// DIALOG
	ERROR_DIALOG_TITLE: 'An error occurred',
	AUTHENTICATING_DIALOG_TITLE: 'Authenticating...',

	// IMAGE UPLOAD
	LOADING_IMAGE: 'loading',
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
	// Shortest side of each thumbnail made on upload, so a square tile is filled at 1x and 2x+ screens
	IMAGE_THUMBNAIL_WIDTHS: Object.freeze([320, 640]),
	// Tiles are 48% of the list on phones and 32% above that, in a card capped at 40rem
	IMAGE_THUMBNAIL_SIZES:
		'(max-width: 480px) 48vw, (max-width: 640px) 32vw, 200px',

	// UPLOAD PROGRESS
	REGISTERING_MESSAGE: 'Registering your details, one moment please...',
	UPLOAD_PROGRESS_LABEL: (uploadedFiles, totalFiles, percent) =>
		`Uploading photos: ${uploadedFiles} of ${totalFiles} done (${percent}%)`,

	// SPINNER: always shown as visible text beside it
	SPINNER_LABEL: {
		DEFAULT: 'Loading…',
		AUTHENTICATING: 'Authenticating…',
		MESSAGES: 'Loading messages…',
		TRAVELLER: 'Loading traveller…',
		DELETING_MESSAGE: 'Deleting message…',
		DELETING_TRAVELLER: 'Deleting traveller…',
	},

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
