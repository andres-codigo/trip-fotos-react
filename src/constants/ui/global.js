export const GLOBAL = Object.freeze({
	SITE_NAME: 'Trip Fotos',

	// FORMS
	REQUIRED_LEGEND: 'required',
	ERROR_SUMMARY_TITLE: 'There is a problem',
	PASSWORD_TOGGLE: Object.freeze({
		SHOW: 'Show',
		HIDE: 'Hide',
		FIELD: 'password',
	}),

	// DIALOG
	ERROR_DIALOG_TITLE: 'An error occurred',

	// IMAGE UPLOAD
	LOADING_IMAGE: 'loading',
	REMOVE_FILE_LABEL: (name) => `Remove ${name}`,
	FILE_DROP_TEXT: Object.freeze({
		ACTIVE: 'Drop your photos here',
		ACTIVE_HINT: 'to add them',
		IDLE: 'Drag photos here',
		IDLE_HINT_PREFIX: 'or',
		IDLE_HINT_ACTION: 'choose photos',
	}),
	FILE_LIST_LABEL: 'Selected files',
	PHOTO_ALT: Object.freeze({
		LABEL: 'Describe this photo (optional)',
		LABEL_FOR: (position) => `Describe photo ${position} (optional)`,
		HELP: 'For people who can’t see it, e.g. Charles Bridge at sunrise.',
	}),

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
	// Tiles are 48% of the list on phones and 32% above that, in a page card capped at 40rem
	IMAGE_THUMBNAIL_SIZES:
		'(max-width: 480px) 48vw, (max-width: 640px) 32vw, 200px',
	// Travellers grid cards: one column under 640px, two to 1023px, then three in a page capped at 1160px (tiles about 90 to 110px)
	IMAGE_CARD_THUMBNAIL_SIZES:
		'(max-width: 480px) 48vw, (max-width: 639px) 32vw, (max-width: 1023px) 16vw, 110px',

	// UPLOAD PROGRESS
	REGISTERING_MESSAGE: 'Registering your details, one moment please...',
	UPLOAD_PROGRESS_LABEL: (uploadedFiles, totalFiles, percent) =>
		`Uploading photos: ${uploadedFiles} of ${totalFiles} done (${percent}%)`,

	// SPINNER: always shown as visible text beside it
	SPINNER_LABEL: {
		DEFAULT: 'Loading…',
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
