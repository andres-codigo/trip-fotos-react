export const getFirebaseAuthErrorMessage = (error) => {
	switch (error) {
		case 'INVALID_LOGIN_CREDENTIALS':
			return 'The email or password you entered is incorrect.';
		default:
			return 'An unexpected error occurred. Please try again.';
	}
};
