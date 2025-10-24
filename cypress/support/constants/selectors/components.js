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

export const authenticationFormSelectors = {
	// Form fields
	authenticationForm: getByDataCy('user-authentication-form'),
	userAuthenticationTitle: getByDataCy('user-authentication-form-title'),
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

export const travellersListSelectors = {
	travellersListContainer: getByDataCy('travellers-list-container'),
	travellersList: getByDataCy('travellers-list'),
	travellerItem: getByDataCy('traveller-item'),
	registerButton: getByDataCy('register-link'),
	controls: getByDataCy('controls'),
}
