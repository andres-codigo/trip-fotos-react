export const VALIDATION_MESSAGES = {
	// AUTHENTICATION FORM
	EMAIL_INVALID: 'Please enter a valid email address.',
	PASSWORD_TOO_SHORT: (difference) =>
		`Your password must be a minimum of 6 characters long! ${difference} characters left.`,

	// TRAVELLER REGISTRATION FORM
	FIRST_NAME_REQUIRED: 'First name must not be empty.',
	LAST_NAME_REQUIRED: 'Last name must not be empty.',
	DESCRIPTION_REQUIRED: 'Description must not be empty.',
	DAYS_REQUIRED: 'Number of days spent in the city cannot be empty.',
	CITIES_REQUIRED: 'At least one city must be selected.',
}
