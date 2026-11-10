// Legacy fixed cities: older records store these ids instead of { id, city, region, country }
export const TRAVELLER_REGISTRATION_CITIES = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
	{ id: 'sydney', label: 'Sydney, Australia' },
	{ id: 'canberra', label: 'Canberra, Australia' },
]

export const TRAVELLER_AREAS = TRAVELLER_REGISTRATION_CITIES.map(({ id }) => id)

export const TRAVELLER_REGISTRATION_FIELDS = Object.freeze({
	FIRST_NAME: 'firstName',
	LAST_NAME: 'lastName',
	TRIP_DESCRIPTION: 'tripDescription',
	DAYS: 'days',
	CITIES: 'cities',
	FILES: 'files',
})

export const TRAVELLER_REGISTRATION_SUCCESS_MESSAGE =
	'You have been successfully registered as a traveller!'

export const TRAVELLER_ITEM_CONFIG = Object.freeze({
	TRIP_DESCRIPTION_MAX_LENGTH: 250,
	MAX_IMAGES: 5,
	CONTACT_PATH_SEGMENT: '/contact',
	PHOTOS_ANCHOR: 'photos',
	DELETE_DIALOG_TITLE: 'Delete traveller?',
})

export const TRAVELLERS_LIST_CONFIG = Object.freeze({
	PAGE_SIZE: 12,
	LOADING_LABEL: 'Loading travellers…',
	SHOW_MORE: (count) => `Show ${count} more`,
	PAGE_STATUS: (shown, total, isFiltered) =>
		`Showing ${shown} of ${total} ${isFiltered ? 'matching ' : ''}travellers`,
	ALL_SHOWN: (total, isFiltered) =>
		`All ${total} ${isFiltered ? 'matching ' : ''}travellers shown`,
	LOAD_ERROR_TITLE: 'Travellers could not be loaded.',
	TRY_AGAIN: 'Try again',
})

export const TRAVELLER_FILTER_CONFIG = Object.freeze({
	LEGEND: 'Filter by city',
	SEARCH_LABEL: 'Search cities',
	SEARCH_THRESHOLD: 4,
	NO_MATCH: (query) => `No cities match “${query}”`,
	SHOW_ALL: 'Show all cities',
	LIST_LABEL: 'Cities',
	TRIGGER_LABEL: 'Filter',
	CLOSE_LABEL: 'Close filter',
	SUMMARY: (selected, total) =>
		selected ? `${selected} of ${total} cities` : `All ${total} cities`,
	STATUS: (selected, total) =>
		selected
			? `${selected} of ${total} cities selected`
			: `All ${total} cities`,
	SHOW_MATCHES: (count) =>
		`Show ${count} ${count === 1 ? 'traveller' : 'travellers'}`,
	NO_RESULTS_TITLE: 'No travellers to show',
	NO_RESULTS_TEXT:
		'None of the travellers left in the list visited these cities.',
})

export const TRAVELLER_DETAIL_CONFIG = Object.freeze({
	FALLBACK_TITLE: 'Traveller',
	NOT_FOUND_MESSAGE: 'Traveller not found.',
	BACK_LABEL: 'Back to travellers',
	PHOTO_PARAM: 'photo',
})

export const CONTACT_TRAVELLER_FIELDS = Object.freeze({
	EMAIL: 'email',
	MESSAGE: 'message',
})

export const CONTACT_TRAVELLER_CONFIG = Object.freeze({
	FALLBACK_TITLE: 'Contact traveller',
	TITLE: (firstName) => `Contact ${firstName}`,
	SUBMIT_LABEL: 'Send Message',
	SENDING_TITLE: 'Sending',
	SENDING_MESSAGE: 'Sending your message, one moment please...',
	SUCCESS_MESSAGE: 'Your message has been sent!',
})

export const CITY_SEARCH_STATUS = Object.freeze({
	IDLE: 'idle',
	LOADING: 'loading',
	SUCCESS: 'success',
	ERROR: 'error',
})
