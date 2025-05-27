export const getFirebaseAuthErrorMessage = (error) => {
	switch (error) {
		case 'INVALID_LOGIN_CREDENTIALS':
			return 'The email or password you entered is incorrect.'
		case 'TOO_MANY_ATTEMPTS_TRY_LATER':
			return 'Too many unsuccessful login attempts. Please try again later.'
		default:
			return 'An unexpected error occurred. Please try again.'
	}
}
