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
	DESCRIPTION: 'description',
	DAYS: 'days',
	CITIES: 'cities',
	FILES: 'files',
})

export const TRAVELLER_REGISTRATION_SUCCESS_MESSAGE =
	'You have been successfully registered as a traveller!'

export const TRAVELLER_ITEM_CONFIG = Object.freeze({
	DESCRIPTION_MAX_LENGTH: 250,
	MAX_IMAGES: 5,
	CONTACT_PATH_SEGMENT: '/contact',
	PHOTOS_ANCHOR: 'photos',
	DELETE_DIALOG_TITLE: 'Delete traveller?',
})

export const TRAVELLER_FILTER_CONFIG = Object.freeze({
	LEGEND: 'Filter by city',
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
