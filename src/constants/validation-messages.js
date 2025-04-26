export const VALIDATION_MESSAGES = {
	EMAIL_INVALID: 'Please enter a valid email address.',
	PASSWORD_TOO_SHORT: (difference) =>
		`Your password must be a minimum of 6 characters long! ${difference} characters left.`,
};
