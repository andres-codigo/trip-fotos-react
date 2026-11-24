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
	TRIP_START: 'tripStart',
	TRIP_END: 'tripEnd',
	CITIES: 'cities',
	FILES: 'files',
})

// MAX_DAYS must match the tripEnd limit in firebase/database.rules.json
export const TRIP_DATES_CONFIG = Object.freeze({
	LEGEND: 'Trip dates',
	START_LABEL: 'From',
	END_LABEL: 'To',
	HINT: 'The day you arrived and the day you left. A day trip uses the same date twice.',
	MAX_DAYS: 366,
})

export const TRAVELLER_REGISTRATION_TEXT = Object.freeze({
	TRIP_DETAILS_HEADING: 'Trip details',
})

export const TRAVELLER_REGISTRATION_SUCCESS_MESSAGE =
	'You have been successfully registered as a traveller!'

export const TRAVELLER_ITEM_CONFIG = Object.freeze({
	TRIP_DESCRIPTION_MAX_LENGTH: 250,
	MAX_IMAGES: 5,
	// The sixth tile is a photo under a scrim when there are more than six, so a trip of six shows them all
	SEE_ALL_LABEL: (total) => `See all ${total} photos`,
	SEE_ALL_COUNT: (hidden) => `+${hidden}`,
	SEE_ALL_SHORT: (total) => `See all ${total}`,
	EDIT_PATH_SEGMENT: '/edit',
	EDIT_LABEL: 'Edit trip',
	VIEW_LABEL: 'View trip',
	MESSAGE_LABEL: (firstName) => `Message ${firstName}`,
	PHOTOS_ANCHOR: 'photos',
	DELETE_DIALOG_TITLE: 'Delete traveller?',
	YOU_LABEL: 'You',
})

export const TRAVELLERS_LIST_CONFIG = Object.freeze({
	TITLE: 'Travellers',
	PAGE_SIZE: 12,
	LOADING_LABEL: 'Loading travellers…',
	SHOW_MORE: (count) => `Show ${count} more`,
	PAGE_STATUS: (shown, total, isFiltered) =>
		`Showing ${shown} of ${total} ${isFiltered ? 'matching ' : ''}travellers`,
	ALL_SHOWN: (total, isFiltered) =>
		`All ${total} ${isFiltered ? 'matching ' : ''}travellers shown`,
	LOAD_ERROR_TITLE: 'Travellers could not be loaded.',
	TRY_AGAIN: 'Try again',
	NO_PUBLIC_TRIPS_TITLE: 'No trips to show yet.',
	NO_PUBLIC_TRIPS_TEXT: 'Create an account and add the first one.',
})

export const TRAVELLERS_WELCOME_CONFIG = Object.freeze({
	TITLE: 'See where travellers have been',
	TEXT: 'Browse trips by city. Create an account to see every photo and message a traveller.',
	CREATE_ACCOUNT: 'Create an account',
	LOG_IN_PROMPT: 'Already have an account?',
	LOG_IN: 'Log in',
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
	PHOTOS_HEADING: 'Photos',
	PHOTO_COUNT: (count) => `${count} ${count === 1 ? 'photo' : 'photos'}`,
	ADD_PHOTOS_LABEL: 'Add photos',
	NO_PHOTOS_MESSAGE:
		'Add at least one photo so other travellers can see your trip.',
})

const photosPhrase = (photoCount) => {
	if (!photoCount) return ''
	return photoCount === 1 ? ', your photo' : `, all ${photoCount} photos`
}

export const EDIT_TRIP_CONFIG = Object.freeze({
	TITLE: 'Edit your trip',
	BACK_LABEL: 'Back to your trip',
	SAVE_LABEL: 'Save changes',
	CANCEL_LABEL: 'Cancel',
	SAVING_TITLE: 'Saving',
	SAVED_MESSAGE: 'Your trip has been saved.',
	DELETE_HEADING: 'Delete my profile',
	DELETE_LABEL: 'Delete my profile',
	DELETE_SUMMARY: (photoCount) =>
		`Removes your trip${photosPhrase(photoCount)} and your messages for good. Your account stays, so you can register a new trip later.`,
	DELETE_DIALOG_TITLE: 'Delete your profile?',
	DELETE_DIALOG_MESSAGE: (photoCount) =>
		`This permanently removes your trip${photosPhrase(photoCount)} and your messages. Your account stays, so you can log in and register a new trip.`,
	DELETING_MESSAGE: 'Deleting your profile…',
	DELETED_MESSAGE: 'Your profile has been deleted.',
})

export const TRIP_PHOTOS_CONFIG = Object.freeze({
	LEGEND: 'Photos',
	HELP: 'JPEG, PNG, WebP or GIF, up to 5 MB each.',
	LIST_LABEL: 'Photos on this trip',
	COUNT: (count) => `${count} ${count === 1 ? 'photo' : 'photos'}`,
	COUNT_AFTER_SAVE: (total, removing, adding) =>
		[
			`${total} ${total === 1 ? 'photo' : 'photos'} after saving`,
			removing && `${removing} to remove`,
			adding && `${adding} to add`,
		]
			.filter(Boolean)
			.join(' · '),
	REMOVE_LABEL: (position, total) => `Remove photo ${position} of ${total}`,
	UNDO_LABEL: (position, total) =>
		`Undo removing photo ${position} of ${total}`,
	REMOVED_LABEL: 'Will be removed',
	UNDO: 'Undo',
	LAST_PHOTO_HINT:
		'A trip needs at least one photo. Add another before removing this one.',
	EMPTY_HINT: 'No photos on this trip yet. Add some below.',
})

// Where a message's sender name comes from: a traveller card, a removed card, a failed lookup, or an older message that stored only an email
export const SENDER_STATUS = Object.freeze({
	TRAVELLER: 'traveller',
	FORMER: 'former',
	UNKNOWN: 'unknown',
	LEGACY: 'legacy',
})

const unreadLabel = (unread) =>
	`${unread} unread conversation${unread === 1 ? '' : 's'}`

export const MESSAGES_CONFIG = Object.freeze({
	TITLE: 'Messages',
	FORMER_TRAVELLER: 'A former traveller',
	UNKNOWN_TRAVELLER: 'A traveller',
	YOU: 'You',
	YOU_PREFIX: 'You: ',
	NEW_DIVIDER: 'New',
	NEW_ROW_HIDDEN: ', new',
	TRAVELLER_SUBTITLE: (place) =>
		place ? `Traveller · ${place}` : 'Traveller',
	FORMER_SUBTITLE: 'Left Trip Fotos',
	LEGACY_SUBTITLE: 'Before travellers-only messages',
	BACK_LABEL: 'Back to messages',
	OPTIONS_LABEL: 'Conversation options',
	VIEW_CARD: 'View traveller card',
	DELETE_CONVERSATION: 'Delete conversation',
	REPLY_LABEL: (name) => `Message ${name}`,
	REPLY_PLACEHOLDER: 'Message',
	SEND: 'Send',
	SENDING: 'Sending…',
	NOT_SENT: 'Not sent.',
	TRY_AGAIN: 'Try again',
	SAY_HELLO: (name) =>
		`This is the start of your conversation with ${name}. Say hello.`,
	SAY_HELLO_PREVIEW: 'Say hello',
	FORMER_NOTE_TITLE: 'This traveller has left Trip Fotos.',
	FORMER_NOTE: 'You can read this conversation but not reply.',
	LEGACY_NOTE:
		'This message was sent by email address, before messages were for travellers only.',
	REPLY_BY_EMAIL: 'Reply by email',
	REPLY_EMAIL_SUBJECT: 'Re: your message on Trip Fotos',
	THREAD_LOAD_ERROR:
		'This conversation could not be loaded. Check your connection and try again.',
	THREAD_LABEL: (name) => `Conversation with ${name}`,
	DELETED: 'Conversation deleted.',
	UNDO: 'Undo',
	UNDO_DURATION_MS: 8000,
	// Mirrors the message length limit in firebase/database.rules.json
	MAX_LENGTH: 5000,
	REPLY_MAX_LINES: 5,
	SUMMARY: (unread, total) =>
		`${unread > 0 ? `${unread} unread · ` : ''}${total} conversation${total === 1 ? '' : 's'}`,
	EMPTY_TITLE: 'No messages yet',
	EMPTY_TEXT:
		'Message a traveller from their card and your conversation appears here.',
	BROWSE_TRAVELLERS: 'Browse travellers',
	LIST_SKELETON_COUNT: 4,
	DESKTOP_LIST_SKELETON_COUNT: 5,
	// Email-only messages from before travellers-only messages have no conversation id, so their route carries this prefix
	LEGACY_ID_PREFIX: 'email-',
	UNREAD_LABEL: unreadLabel,
	NAV_LABEL: (unread) =>
		unread > 0 ? `Messages, ${unreadLabel(unread)}` : 'Messages',
})

export const CITY_SEARCH_STATUS = Object.freeze({
	IDLE: 'idle',
	LOADING: 'loading',
	SUCCESS: 'success',
	ERROR: 'error',
})
