export const VALIDATION_MESSAGES = {
	// AUTHENTICATION FORM
	EMAIL_INVALID: 'Please enter a valid email address.',
	PASSWORD_TOO_SHORT: (difference) =>
		`Your password must be a minimum of 6 characters long! ${difference} characters left.`,

	// TRAVELLER REGISTRATION FORM
	FIRST_NAME_REQUIRED: 'First name must not be empty.',
	LAST_NAME_REQUIRED: 'Last name must not be empty.',
	TRIP_DESCRIPTION_REQUIRED: 'About your trip must not be empty.',
	TRIP_START_REQUIRED: 'Enter the day your trip started.',
	TRIP_END_REQUIRED: 'Enter the day your trip ended.',
	TRIP_END_BEFORE_START: 'The end date must be on or after the start date.',
	TRIP_DATE_IN_FUTURE: 'Trip dates cannot be in the future.',
	TRIP_TOO_LONG: (maxDays) =>
		`A trip can be up to a year long (${maxDays} days).`,
	CITIES_REQUIRED: 'At least one city must be selected.',

	// CONTACT TRAVELLER FORM
	MESSAGE_REQUIRED: 'Message must not be empty.',
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
})

// Must match the messages limit in firebase/database.rules.json, or messages the form accepts are rejected on save
export const CONTACT_MESSAGE = Object.freeze({
	MAX_LENGTH: 5000,
})
