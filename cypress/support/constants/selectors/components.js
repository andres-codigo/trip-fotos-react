import {
	getByDataCy,
	getByDataCyError,
} from '../../../../src/testUtils/cypress/selectors'

/////
/// Common Component Selectors
/////
export const commonSelectors = {
	baseCard: getByDataCy('base-card'),
	baseSpinner: getByDataCy('base-spinner'),
}

/////
/// Component Selectors
/////
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
