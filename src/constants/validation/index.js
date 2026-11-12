export const VALIDATION_MESSAGES = {
	// AUTHENTICATION FORM
	EMAIL_INVALID: 'Enter an email address like name@example.com.',
	PASSWORD_REQUIRED: 'Enter your password.',
	PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',

	// TRAVELLER REGISTRATION FORM
	FIRST_NAME_REQUIRED: 'Enter your first name.',
	LAST_NAME_REQUIRED: 'Enter your last name.',
	TRIP_DESCRIPTION_REQUIRED: 'Tell other travellers about your trip.',
	TRIP_START_REQUIRED: 'Enter the day your trip started.',
	TRIP_END_REQUIRED: 'Enter the day your trip ended.',
	TRIP_END_BEFORE_START: 'The end date must be on or after the start date.',
	TRIP_DATE_IN_FUTURE: 'Trip dates cannot be in the future.',
	TRIP_TOO_LONG: (maxDays) =>
		`A trip can be up to a year long (${maxDays} days).`,
	CITIES_REQUIRED: 'Add at least one city.',
	PHOTOS_REQUIRED: 'Add at least one photo.',

	// CONTACT TRAVELLER FORM
	MESSAGE_REQUIRED: 'Write a message.',
	MESSAGE_TOO_LONG: (maxLength) =>
		`Message must be ${maxLength} characters or fewer.`,

	// FILE UPLOAD
	FILE_TYPE_INVALID: (name) =>
		`${name} is not a supported image type. Use JPEG, PNG, WebP or GIF.`,
	FILE_TOO_LARGE: (name, maxMegabytes) =>
		`${name} is larger than the ${maxMegabytes} MB limit.`,
}

export const FILE_UPLOAD = Object.freeze({
	ACCEPTED_TYPES: Object.freeze([
		'image/jpeg',
		'image/png',
		'image/webp',
		'image/gif',
	]),
	MAX_SIZE_MEGABYTES: 5,
	// Must match the fileAlts limit in firebase/database.rules.json
	ALT_MAX_LENGTH: 150,
})

// Must match the messages limit in firebase/database.rules.json, or messages the form accepts are rejected on save
export const CONTACT_MESSAGE = Object.freeze({
	MAX_LENGTH: 5000,
})
