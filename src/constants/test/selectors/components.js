import { FIREBASE_ERRORS } from '../../auth'

import {
	getByDataCy,
	getByDataCyError,
} from '../../../testUtils/cypress/selectors'

/////
/// Common Component Selectors
/////
export const COMMON_SELECTORS = {
	BASE_CARD: getByDataCy('base-card'),
	BASE_SPINNER: getByDataCy('base-spinner'),
}

/////
/// Layout Selectors
/////
export const HEADER_SELECTORS = {
	SITE_HEADER: getByDataCy('site-header'),
	SITE_HEADER_TITLE_LINK: getByDataCy('site-header-title-link'),
}

export const TOP_NAVIGATION_SELECTORS = {
	NAV_MENU_CONTAINER: getByDataCy('nav-menu-container'),
	HAMBURGER_MENU: getByDataCy('hamburger-menu'),
	NAV_MENU_ITEMS_CONTAINER: getByDataCy('nav-menu-items-container'),
	NAV_MENU_ITEM_MESSAGES: getByDataCy('nav-menu-item-messages'),
	TOTAL_MESSAGES: getByDataCy('total-messages'),
	NAV_MENU_ITEM_TRAVELLERS: getByDataCy('nav-menu-item-travellers'),
	NAV_MENU_ITEM_LOGIN: getByDataCy('nav-menu-item-login'),
	NAV_MENU_ITEM_LOGOUT: getByDataCy('nav-menu-item-logout'),
}

/////
/// Form Selectors
/////
export const AUTHENTICATION_FORM_SELECTORS = {
	// Form fields
	AUTHENTICATION_FORM: getByDataCy('user-authentication-form'),
	USER_AUTHENTICATION_TITLE: getByDataCy('user-authentication-form-title'),
	// Email fields
	EMAIL_LABEL: 'E-Mail',
	EMAIL_INPUT: getByDataCy('email-input'),
	EMAIL_ERROR_MESSAGE: getByDataCyError('email-error-message'),
	// Password fields
	PASSWORD_LABEL: 'Password',
	PASSWORD_INPUT: getByDataCy('password-input'),
	PASSWORD_ERROR_MESSAGE: getByDataCyError('password-error-message'),
	// Submit buttons
	SUBMIT_BUTTON_TEXT_LOGIN: 'Log in',
	SIGNUP_TEXT_SUBMIT_BUTTON: 'Sign up',
	LOGIN_SIGNUP_SUBMIT_BUTTON: getByDataCy('login-submit-button'),
	// Toggle link for switching between login and signup
	LOGIN_SIGNUP_TOGGLE_LINK: getByDataCy('login-signup-toggle-link'),
	LOGIN_TEXT_TOGGLE_LINK: 'Switch to Login',
	SIGNUP_TEXT_TOGGLE_LINK: 'Switch to Signup',
}

export const TRAVELLER_REGISTRATION_FORM_SELECTORS = {
	FORM: getByDataCy('traveller-registration-form'),
	FIRST_NAME_INPUT: getByDataCy('first-name-input'),
	LAST_NAME_INPUT: getByDataCy('last-name-input'),
	DESCRIPTION_INPUT: getByDataCy('description-input'),
	DAYS_INPUT: getByDataCy('days-input'),
	CHECKBOX_TOKYO: getByDataCy('checkbox-tokyo'),
	CHECKBOX_PRAGUE: getByDataCy('checkbox-prague'),
	CHECKBOX_SYDNEY: getByDataCy('checkbox-sydney'),
	CHECKBOX_CANBERRA: getByDataCy('checkbox-canberra'),
	SUBMIT_BUTTON: getByDataCy('submit-button'),
}

/////
/// Traveller Selectors
/////
export const TRAVELLERS_LIST_SELECTORS = {
	TRAVELLERS_LIST_CONTAINER: getByDataCy('travellers-list-container'),
	TRAVELLERS_LIST: getByDataCy('travellers-list'),
	TRAVELLER_ITEM: getByDataCy('traveller-item'),
	REGISTER_BUTTON: getByDataCy('register-link'),
	CONTROLS: getByDataCy('controls'),
}

/////
/// UI Selectors
/////
export const DIALOG_SELECTORS = {
	// Dialog
	INVALID_EMAIL_OR_PASSWORD: getByDataCy('invalid-email-or-password-dialog'),
	AUTHENTICATING: getByDataCy('authenticating-dialog'),
	TRAVELLERS_LIST_ERROR: getByDataCy('travellers-list-error-dialog'),
	// Dialog elements
	TITLE: getByDataCy('title'),
	TEXT_CONTENT: getByDataCy('text-content'),
	SPINNER_CONTAINER: getByDataCy('base-spinner'),
	SPINNER_IMAGE: getByDataCy('base-spinner-img'),

	// Messages
	MESSAGES: {
		LOADING: {
			TITLE: 'Authenticating',
			TEXT: 'Authenticating your details, one moment please...',
		},
		ERROR: {
			TITLE: 'An error occurred',
		},
		AUTHENTICATION_ERRORS: {
			[FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.INVALID_LOGIN_CREDENTIALS]:
				FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
					.INVALID_LOGIN_CREDENTIALS_MESSAGE,
			[FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.TOO_MANY_ATTEMPTS_TRY_LATER]:
				FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
					.TOO_MANY_ATTEMPTS_TRY_LATER_MESSAGE,
			[FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES.DEFAULT]:
				FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES.DEFAULT_MESSAGE,
		},
	},
}
