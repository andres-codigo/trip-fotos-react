export const NAVIGATION = Object.freeze({
	MAIN_LABEL: 'Main',
	TRAVELLERS: 'Travellers',
	MESSAGES: 'Messages',
	MY_TRIP: 'My trip',
	REGISTER: 'Register',
	ACCOUNT_LABEL: (name) => (name ? `Account, ${name}` : 'Account'),
	ACCOUNT_FALLBACK: 'Account',
	SIGNED_IN_AS: 'Signed in as',
	LOG_OUT: 'Log out',
})

export const PAGE_NOT_FOUND_CONFIG = Object.freeze({
	TITLE: 'This page is not available.',
	TEXT: 'The link may be old, or the trip may have been removed.',
	TRAVELLERS_LABEL: 'Go to Travellers',
	LOG_IN_LABEL: 'Log in',
})
