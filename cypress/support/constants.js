import { FIREBASE_ERROR_TYPES } from '../../src/constants/firebase-error-types'

import {
	getByDataCy,
	getByDataCyError,
} from '../../src/testUtils/cypress/selectors'

export const apiDatabase = {
	// API
	apiUrl: Cypress.env('API_URL'),
	apiKey: Cypress.env('API_KEY'),

	// DATABASE
	POST: 'POST',
}

export const apiUrls = {
	signInWithPassword: `${apiDatabase.apiUrl}signInWithPassword?key=${apiDatabase.apiKey}`,
}

export const errorMessages = {
	[FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
		.INVALID_LOGIN_CREDENTIALS]:
		FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
			.INVALID_LOGIN_CREDENTIALS_MESSAGE,
	[FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
		.TOO_MANY_ATTEMPTS_TRY_LATER]:
		FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
			.TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE,
	[FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES.DEFAULT]:
		FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES.DEFAULT_MESSAGE,
}

export const baseUrl = Cypress.config('baseUrl')

export const urls = {
	cyAuth: Cypress.env('AUTHENTICATION_URL'),
	cyTrips: Cypress.env('TRIPS_URL'),
	cyMessages: Cypress.env('MESSAGES_URL'),
	cyPageNotFound: Cypress.env('PAGENOTFOUND_URL'),
	cyNonExistentPath: Cypress.env('NON_EXISTENT_URL'),
}

export const viewports = {
	mobile: {
		width: 375,
		height: 667,
	},
	tablet: {
		width: 1024,
		height: 768,
	},
	desktop: {
		width: 1280,
		height: 800,
	},
}

export const user = {
	validEmail: Cypress.env('USER_EMAIL'),
	validPassword: Cypress.env('USER_PASSWORD'),
	invalidEmail: 'invalid-email',
	invalidPassword: 'invalid-password',
	invalidPasswordTooShort: '12345',
}

export const domAttributeUrls = {
	root: Cypress.env('ROOT_URL'),
}

export const dialog = {
	// Dialog
	invalidEmailOrPassword: getByDataCy('invalid-email-or-password-dialog'),
	loading: getByDataCy('loading-dialog'),
	// Dialog elements
	title: getByDataCy('title'),
	textContent: getByDataCy('text-content'),
	spinnerContainer: getByDataCy('base-spinner'),
	spinnerImage: getByDataCy('base-spinner-img'),
}

export const dialogMessages = {
	loading: {
		title: 'Authenticating',
		text: 'Authenticating your details, one moment please...',
	},
	error: {
		title: 'An error occurred',
	},
}

export const testSelectors = {
	locationDisplay: getByDataCy('location-display'),
}

export const headerSelectors = {
	siteHeader: getByDataCy('site-header'),
	siteHeaderTitleLink: getByDataCy('site-header-title-link'),
}

export const topNavigationSelectors = {
	navMenuContainer: getByDataCy('nav-menu-container'),
	navHamburgerMenu: getByDataCy('hamburger-menu'),
	navMenuItemsContainer: getByDataCy('nav-menu-items-container'),
	navMenuItemMessages: getByDataCy('nav-menu-item-messages'),
	totalMessages: getByDataCy('total-messages'),
	navMenuItemTravellers: getByDataCy('nav-menu-item-travellers'),
	navMenuItemLogin: getByDataCy('nav-menu-item-login'),
	navMenuItemLogout: getByDataCy('nav-menu-item-logout'),
}

export const authenticationFormSelectors = {
	// Form fields
	authenticationForm: getByDataCy('user-authentication-form'),
	// Email fields
	emailLabel: 'E-Mail',
	emailInput: getByDataCy('email-input'),
	emailErrorMessage: getByDataCyError('email-error-message'),
	// Password fields
	passwordLabel: 'Password',
	passwordInput: getByDataCy('password-input'),
	passwordErrorMessage: getByDataCyError('password-error-message'),
	// Submit buttons
	submitButtonTextLogin: 'Log in',
	signupTextSubmitButton: 'Sign up',
	loginSignupSubmitButton: getByDataCy('login-submit-button'),
	// Toggle link for switching between login and signup
	loginSignupToggleLink: getByDataCy('login-signup-toggle-link'),
	loginTextToggleLink: 'Switch to Login',
	signupTextToggleLink: 'Switch to Signup',
}

export const pageNotFoundSelectors = {
	homeLink: getByDataCy('home-link'),
}

export const pageSelectors = {
	tripsPage: getByDataCy('trips-page'),
	messagesPage: getByDataCy('messages-page'),
	authenticationPage: getByDataCy('authentication-page'),
	pageNotFoundPage: getByDataCy('page-not-found-page'),
}
