import { ERROR_MESSAGES } from '../../errors'

import { IDENTITY_TOOLKIT_ERRORS } from '../mock-data/mock-api'

import {
	getByDataCy,
	getByDataCyError,
} from '../../../testUtils/cypress/selectors'

import {
	BADGE,
	COMBOBOX,
	CONTACT_TRAVELLER,
	FILE_DROP,
	FILE_PREVIEW,
	IMAGE,
	MESSAGE_ITEM,
	MESSAGES_PAGE,
	PROGRESS,
	TRAVELLER_DETAIL,
	TRAVELLER_FILTER,
	TRAVELLER_ITEM,
} from '../ui-constants'

/////
/// Common Component Selectors
/////
export const COMMON_SELECTORS = {
	BASE_CARD: getByDataCy('base-card'),
	BASE_SPINNER: getByDataCy('base-spinner'),
	BASE_PROGRESS: getByDataCy(PROGRESS.ID),
	BASE_PROGRESS_BAR: getByDataCy(PROGRESS.BAR),
	BASE_PROGRESS_LABEL: getByDataCy(PROGRESS.LABEL),
	BASE_BADGE: getByDataCy(BADGE.ID),
	BASE_IMAGE: getByDataCy(IMAGE.ID),
	BASE_IMAGE_BUTTON: getByDataCy(IMAGE.BUTTON),
	BASE_IMAGE_THUMBNAIL: getByDataCy(IMAGE.THUMBNAIL),
	BASE_IMAGE_FULL: getByDataCy(IMAGE.FULL),
	BASE_IMAGE_FALLBACK: getByDataCy(IMAGE.FALLBACK),
}

/////
/// Layout Selectors
/////
export const HEADER_SELECTORS = {
	SITE_HEADER: getByDataCy('site-header'),
	SITE_HEADER_TITLE_LINK: getByDataCy('site-header-title-link'),
}

export const SKIP_LINK_SELECTORS = {
	SKIP_LINK: getByDataCy('skip-link'),
}

export const FOOTER_SELECTORS = {
	SITE_FOOTER: getByDataCy('site-footer'),
	PRIVACY_LINK: getByDataCy('footer-privacy-link'),
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

export const FILE_UPLOADER_SELECTORS = {
	FILE_DROP: getByDataCy(FILE_DROP.ID),
	FILE_DROP_INPUT: getByDataCy(FILE_DROP.INPUT),
	FILE_DROP_LIST: getByDataCy(FILE_DROP.LIST),
	FILE_DROP_ERRORS: getByDataCy(FILE_DROP.ERRORS),
	FILE_PREVIEW: getByDataCy(FILE_PREVIEW.ID),
	FILE_PREVIEW_REMOVE: getByDataCy(FILE_PREVIEW.REMOVE_BUTTON),
	FILE_PREVIEW_THUMBNAIL: getByDataCy(FILE_PREVIEW.THUMBNAIL),
	FILE_PREVIEW_NAME: getByDataCy(FILE_PREVIEW.NAME),
	FILE_PREVIEW_STATUS: getByDataCy(FILE_PREVIEW.STATUS),
}

export const TRAVELLER_REGISTRATION_FORM_SELECTORS = {
	FORM: getByDataCy('traveller-registration-form'),
	FIRST_NAME_INPUT: getByDataCy('first-name-input'),
	LAST_NAME_INPUT: getByDataCy('last-name-input'),
	DESCRIPTION_INPUT: getByDataCy('description-input'),
	DAYS_SPENT_IN_CITY_INPUT: getByDataCy('days-spent-in-city-input'),
	SELECTED_CITIES: getByDataCy('selected-cities'),
	SELECTED_CITY: getByDataCy('selected-city'),
	SELECTED_CITY_REMOVE: getByDataCy('selected-city-remove'),
	REGISTER_BUTTON: getByDataCy('register-button'),
}

/////
/// Traveller Selectors
/////
export const TRAVELLERS_LIST_SELECTORS = {
	TRAVELLERS_LIST_CONTAINER: getByDataCy('travellers-list-container'),
	TRAVELLERS_LIST: getByDataCy('travellers-list'),
	TRAVELLER_ITEM: getByDataCy('traveller-item'),
	REGISTER_LINK: getByDataCy('register-link'),
	REFRESH_BUTTON: getByDataCy('refresh-button'),
	CONTROLS: getByDataCy('controls'),
	NO_TRAVELLERS: getByDataCy('no-travellers-list'),
	NO_MATCHING_TRAVELLERS: getByDataCy('no-matching-travellers'),
}

/////
/// UI Selectors
/////
export const COMBOBOX_SELECTORS = {
	INPUT: getByDataCy(COMBOBOX.INPUT),
	LISTBOX: getByDataCy(COMBOBOX.LISTBOX),
	OPTION: getByDataCy(COMBOBOX.OPTION),
	STATUS: getByDataCy(COMBOBOX.STATUS),
}

export const DIALOG_SELECTORS = {
	// Dialog
	INVALID_EMAIL_OR_PASSWORD: getByDataCy('invalid-email-or-password-dialog'),
	INVALID_TRAVELLER_REGISTRATION: getByDataCy(
		'invalid-traveller-registration-dialog',
	),
	AUTHENTICATING: getByDataCy('authenticating-dialog'),
	REGISTERING: getByDataCy('registering-dialog'),
	TRAVELLERS_LIST_ERROR: getByDataCy('travellers-list-error-dialog'),
	// Dialog elements
	TITLE: getByDataCy('title'),
	TEXT_CONTENT: getByDataCy('text-content'),
	CLOSE_BUTTON: getByDataCy('dialog-button'),
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
			[IDENTITY_TOOLKIT_ERRORS.INVALID_LOGIN_CREDENTIALS]:
				ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
			[IDENTITY_TOOLKIT_ERRORS.EMAIL_EXISTS]:
				ERROR_MESSAGES.EMAIL_ALREADY_IN_USE,
			[IDENTITY_TOOLKIT_ERRORS.TOO_MANY_ATTEMPTS_TRY_LATER]:
				ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS,
			[IDENTITY_TOOLKIT_ERRORS.UNMAPPED]: ERROR_MESSAGES.LOGIN_FAILED,
		},
	},
}

export const TRAVELLER_ITEM_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_ITEM.ROOT),
	NAME: getByDataCy(TRAVELLER_ITEM.NAME),
	REGISTERED: getByDataCy(TRAVELLER_ITEM.REGISTERED),
	DESCRIPTION: getByDataCy(TRAVELLER_ITEM.DESCRIPTION),
	DAYS: getByDataCy(TRAVELLER_ITEM.DAYS),
	BADGES: getByDataCy(TRAVELLER_ITEM.BADGES),
	IMAGES_LIST: getByDataCy(TRAVELLER_ITEM.IMAGES_LIST),
	SEE_ALL_LINK: getByDataCy(TRAVELLER_ITEM.SEE_ALL_LINK),
	CONTACT: getByDataCy(TRAVELLER_ITEM.CONTACT),
	DETAILS: getByDataCy(TRAVELLER_ITEM.DETAILS),
	DELETE: getByDataCy(TRAVELLER_ITEM.DELETE),
	SPINNER: getByDataCy(TRAVELLER_ITEM.SPINNER),
	ERROR_DIALOG: getByDataCy(TRAVELLER_ITEM.ERROR_DIALOG),
	DELETE_DIALOG: getByDataCy(TRAVELLER_ITEM.DELETE_DIALOG),
	DELETE_CANCEL: getByDataCy(TRAVELLER_ITEM.DELETE_CANCEL),
	DELETE_CONFIRM: getByDataCy(TRAVELLER_ITEM.DELETE_CONFIRM),
}

export const TRAVELLER_DETAIL_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_DETAIL.ROOT),
	NAME: getByDataCy(TRAVELLER_DETAIL.NAME),
	SPINNER: getByDataCy(TRAVELLER_DETAIL.SPINNER),
	NOT_FOUND: getByDataCy(TRAVELLER_DETAIL.NOT_FOUND),
	BACK_LINK: getByDataCy(TRAVELLER_DETAIL.BACK_LINK),
	PROFILE: getByDataCy(TRAVELLER_DETAIL.PROFILE),
	DESCRIPTION: getByDataCy(TRAVELLER_DETAIL.DESCRIPTION),
	DAYS: getByDataCy(TRAVELLER_DETAIL.DAYS),
	BADGES: getByDataCy(TRAVELLER_DETAIL.BADGES),
	IMAGES_LIST: getByDataCy(TRAVELLER_DETAIL.IMAGES_LIST),
	CONTACT_SECTION: getByDataCy(TRAVELLER_DETAIL.CONTACT_SECTION),
	CONTACT: getByDataCy(TRAVELLER_DETAIL.CONTACT),
}

export const TRAVELLER_FILTER_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_FILTER.ROOT),
	OPTION: getByDataCy(TRAVELLER_FILTER.OPTION),
	CHECKBOX: getByDataCy(TRAVELLER_FILTER.CHECKBOX),
}

export const CONTACT_TRAVELLER_SELECTORS = {
	ROOT: getByDataCy(CONTACT_TRAVELLER.ROOT),
	TITLE: getByDataCy(CONTACT_TRAVELLER.TITLE),
	FORM: getByDataCy(CONTACT_TRAVELLER.FORM),
	EMAIL_INPUT: getByDataCy(CONTACT_TRAVELLER.EMAIL_INPUT),
	EMAIL_ERROR: getByDataCyError(CONTACT_TRAVELLER.EMAIL_ERROR),
	MESSAGE_INPUT: getByDataCy(CONTACT_TRAVELLER.MESSAGE_INPUT),
	MESSAGE_ERROR: getByDataCyError(CONTACT_TRAVELLER.MESSAGE_ERROR),
	SUBMIT: getByDataCy(CONTACT_TRAVELLER.SUBMIT),
	SENDING_DIALOG: getByDataCy(CONTACT_TRAVELLER.SENDING_DIALOG),
	ERROR_DIALOG: getByDataCy(CONTACT_TRAVELLER.ERROR_DIALOG),
}

export const MESSAGES_PAGE_SELECTORS = {
	SPINNER: getByDataCy(MESSAGES_PAGE.SPINNER),
	LIST: getByDataCy(MESSAGES_PAGE.LIST),
	EMPTY: getByDataCy(MESSAGES_PAGE.EMPTY),
	ERROR_DIALOG: getByDataCy(MESSAGES_PAGE.ERROR_DIALOG),
}

export const MESSAGE_ITEM_SELECTORS = {
	ROOT: getByDataCy(MESSAGE_ITEM.ROOT),
	EMAIL: getByDataCy(MESSAGE_ITEM.EMAIL),
	TEXT: getByDataCy(MESSAGE_ITEM.TEXT),
	DELETE: getByDataCy(MESSAGE_ITEM.DELETE),
	SPINNER: getByDataCy(MESSAGE_ITEM.SPINNER),
	ERROR_DIALOG: getByDataCy(MESSAGE_ITEM.ERROR_DIALOG),
}
