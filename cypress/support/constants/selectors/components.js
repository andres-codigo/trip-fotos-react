import {
	getByDataCy,
	getByDataCyError,
} from '../../../../src/testUtils/cypress/selectors'

/////
/// Common Component Selectors
/////
export const COMMON_SELECTORS = {
	BASE_CARD: getByDataCy('base-card'),
	BASE_SPINNER: getByDataCy('base-spinner'),
}

/////
/// Component Selectors
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

export const travellersListSelectors = {
	travellersListContainer: getByDataCy('travellers-list-container'),
	travellersList: getByDataCy('travellers-list'),
	travellerItem: getByDataCy('traveller-item'),
	registerButton: getByDataCy('register-link'),
	controls: getByDataCy('controls'),
}
