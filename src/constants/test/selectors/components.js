import { ERROR_MESSAGES } from '../../errors'

import { IDENTITY_TOOLKIT_ERRORS } from '../mock-data/mock-api'

import {
	getByDataCy,
	getByDataCyError,
} from '../../../testUtils/cypress/selectors'

import {
	ACCOUNT_MENU,
	AVATAR,
	BADGE,
	COMBOBOX,
	INPUT,
	CONTACT_TRAVELLER,
	FILE_DROP,
	FILE_PREVIEW,
	IMAGE,
	MESSAGE_ITEM,
	MESSAGE_SKELETON,
	MESSAGES_PAGE,
	PASSWORD_RESET_FORM,
	PROGRESS,
	PUBLIC_TRAVELLER_ITEM,
	REQUIRED_LEGEND,
	SHEET,
	TAB_BAR,
	TOAST,
	TRAVELLER_CARD_HEAD,
	TRAVELLER_DETAIL,
	EDIT_TRIP,
	ERROR_SUMMARY,
	TRIP_PHOTOS,
	TRAVELLER_FILTER,
	TRAVELLERS_WELCOME,
	TRAVELLER_ITEM,
	TRAVELLER_SKELETON,
	YOU_TAG,
} from '../ui-constants'

/////
/// Common Component Selectors
/////
export const COMMON_SELECTORS = {
	BASE_CARD: getByDataCy('base-card'),
	BASE_SPINNER: getByDataCy('base-spinner'),
	BASE_SPINNER_ICON: getByDataCy('base-spinner-icon'),
	BASE_PROGRESS: getByDataCy(PROGRESS.ID),
	BASE_PROGRESS_BAR: getByDataCy(PROGRESS.BAR),
	BASE_PROGRESS_LABEL: getByDataCy(PROGRESS.LABEL),
	BASE_BADGE: getByDataCy(BADGE.ID),
	BASE_IMAGE: getByDataCy(IMAGE.ID),
	BASE_IMAGE_BUTTON: getByDataCy(IMAGE.BUTTON),
	BASE_IMAGE_THUMBNAIL: getByDataCy(IMAGE.THUMBNAIL),
	BASE_IMAGE_FULL: getByDataCy(IMAGE.FULL),
	BASE_IMAGE_FALLBACK: getByDataCy(IMAGE.FALLBACK),
	IMAGE_GALLERY_PREVIOUS: getByDataCy(IMAGE.PREVIOUS),
	IMAGE_GALLERY_NEXT: getByDataCy(IMAGE.NEXT),
	IMAGE_GALLERY_COUNTER: getByDataCy(IMAGE.COUNTER),
	IMAGE_GALLERY_CAPTION: getByDataCy(IMAGE.CAPTION),
}

export const AVATAR_SELECTORS = {
	ROOT: getByDataCy(AVATAR.ROOT),
}

/////
/// Layout Selectors
/////
export const HEADER_SELECTORS = {
	SITE_HEADER: getByDataCy('site-header'),
	SITE_HEADER_TITLE_LINK: getByDataCy('site-header-title-link'),
}

export const ACCOUNT_MENU_SELECTORS = {
	ROOT: getByDataCy(ACCOUNT_MENU.ROOT),
	BUTTON: getByDataCy(ACCOUNT_MENU.BUTTON),
	PANEL: getByDataCy(ACCOUNT_MENU.PANEL),
	SIGNED_IN_AS: getByDataCy(ACCOUNT_MENU.SIGNED_IN_AS),
	LOG_OUT: getByDataCy(ACCOUNT_MENU.LOG_OUT),
}

export const TAB_BAR_SELECTORS = {
	ROOT: getByDataCy(TAB_BAR.ROOT),
	TRAVELLERS: getByDataCy(TAB_BAR.TRAVELLERS),
	MESSAGES: getByDataCy(TAB_BAR.MESSAGES),
	MY_TRIP: getByDataCy(TAB_BAR.MY_TRIP),
	REGISTER: getByDataCy(TAB_BAR.REGISTER),
	UNREAD: getByDataCy(TAB_BAR.UNREAD),
	SPACER: getByDataCy(TAB_BAR.SPACER),
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
	NAV_MENU_ITEMS_CONTAINER: getByDataCy('nav-menu-items-container'),
	NAV_MENU_ITEM_MESSAGES: getByDataCy('nav-menu-item-messages'),
	TOTAL_MESSAGES: getByDataCy('total-messages'),
	NAV_MENU_ITEM_TRAVELLERS: getByDataCy('nav-menu-item-travellers'),
	NAV_MENU_ITEM_MY_TRIP: getByDataCy('nav-menu-item-my-trip'),
	NAV_MENU_ITEM_REGISTER: getByDataCy('nav-menu-item-register'),
}

/////
/// Form Selectors
/////
export const AUTHENTICATION_FORM_SELECTORS = {
	// Form fields
	AUTHENTICATION_FORM: getByDataCy('user-authentication-form'),
	USER_AUTHENTICATION_TITLE: getByDataCy('user-authentication-form-title'),
	EMAIL_INPUT: getByDataCy('email-input'),
	EMAIL_ERROR_MESSAGE: getByDataCyError('email-error-message'),
	PASSWORD_INPUT: getByDataCy('password-input'),
	PASSWORD_ERROR_MESSAGE: getByDataCyError('password-error-message'),
	LOGIN_SIGNUP_SUBMIT_BUTTON: getByDataCy('login-submit-button'),
	// Toggle link for switching between login and signup
	LOGIN_SIGNUP_TOGGLE_LINK: getByDataCy('login-signup-toggle-link'),
	FORGOT_PASSWORD_LINK: getByDataCy('forgot-password-link'),
	PASSWORD_TOGGLE: getByDataCy(INPUT.PASSWORD_TOGGLE),
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
	FILE_PREVIEW_ALT_INPUT: getByDataCy(FILE_PREVIEW.ALT_INPUT),
}

export const TRAVELLER_REGISTRATION_FORM_SELECTORS = {
	FORM: getByDataCy('traveller-registration-form'),
	FIRST_NAME_INPUT: getByDataCy('first-name-input'),
	LAST_NAME_INPUT: getByDataCy('last-name-input'),
	TRIP_DESCRIPTION_INPUT: getByDataCy('trip-description-input'),
	TRIP_DATES: getByDataCy('trip-dates'),
	COLUMNS: getByDataCy('traveller-registration-columns'),
	TRIP_DETAILS: getByDataCy('trip-details'),
	PHOTOS_SECTION: getByDataCy('traveller-photos-section'),
	ACTIONS: getByDataCy('traveller-registration-actions'),
	PHOTOS: getByDataCy('traveller-photos'),
	TRIP_START_INPUT: getByDataCy('trip-start-input'),
	TRIP_END_INPUT: getByDataCy('trip-end-input'),
	TRIP_LENGTH: getByDataCy('trip-length'),
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
	SHOW_ALL_CITIES: getByDataCy('travellers-show-all-cities'),
	LOADING: getByDataCy('travellers-loading'),
	SKELETON_LIST: getByDataCy('travellers-skeleton-list'),
	SHOW_MORE: getByDataCy('show-more-travellers'),
	PAGE_STATUS: getByDataCy('travellers-page-status'),
	LOAD_ERROR: getByDataCy('travellers-load-error'),
	TRY_AGAIN: getByDataCy('travellers-try-again'),
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

export const ERROR_SUMMARY_SELECTORS = {
	ROOT: getByDataCy(ERROR_SUMMARY.ROOT),
	LINK: getByDataCy(ERROR_SUMMARY.LINK),
}

export const REQUIRED_LEGEND_SELECTORS = {
	ROOT: getByDataCy(REQUIRED_LEGEND.ROOT),
}

export const SHEET_SELECTORS = {
	ROOT: getByDataCy(SHEET.ID),
	BACKDROP: getByDataCy(SHEET.BACKDROP),
	TITLE: getByDataCy(SHEET.TITLE),
	CLOSE: getByDataCy(SHEET.CLOSE),
	BODY: getByDataCy(SHEET.BODY),
	FOOTER: getByDataCy(SHEET.FOOTER),
}

export const TOAST_SELECTORS = {
	ROOT: getByDataCy(TOAST.ROOT),
	MESSAGE: getByDataCy(TOAST.MESSAGE),
	ACTION: getByDataCy(TOAST.ACTION),
	DISMISS: getByDataCy(TOAST.DISMISS),
}

export const DIALOG_SELECTORS = {
	// Dialog
	INVALID_EMAIL_OR_PASSWORD: getByDataCy('invalid-email-or-password-dialog'),
	INVALID_TRAVELLER_REGISTRATION: getByDataCy(
		'invalid-traveller-registration-dialog',
	),
	REGISTERING: getByDataCy('registering-dialog'),
	// Dialog elements
	TITLE: getByDataCy('title'),
	TEXT_CONTENT: getByDataCy('text-content'),
	CLOSE_BUTTON: getByDataCy('dialog-button'),
	SPINNER_CONTAINER: getByDataCy('base-spinner'),
	SPINNER_LABEL: getByDataCy('base-spinner-label'),

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

export const TRAVELLER_SKELETON_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_SKELETON.ROOT),
}

export const MESSAGE_SKELETON_SELECTORS = {
	ROOT: getByDataCy(MESSAGE_SKELETON.ROOT),
}

export const TRAVELLER_ITEM_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_ITEM.ROOT),
	NAME: getByDataCy(TRAVELLER_ITEM.NAME),
	TRIP_DESCRIPTION: getByDataCy(TRAVELLER_ITEM.TRIP_DESCRIPTION),
	TRIP: getByDataCy(TRAVELLER_ITEM.TRIP),
	BADGES: getByDataCy(TRAVELLER_ITEM.BADGES),
	IMAGES_LIST: getByDataCy(TRAVELLER_ITEM.IMAGES_LIST),
	SEE_ALL_LINK: getByDataCy(TRAVELLER_ITEM.SEE_ALL_LINK),
	MESSAGE: getByDataCy(TRAVELLER_ITEM.MESSAGE),
	VIEW_TRIP: getByDataCy(TRAVELLER_ITEM.VIEW_TRIP),
	DELETE: getByDataCy(TRAVELLER_ITEM.DELETE),
	SPINNER: getByDataCy(TRAVELLER_ITEM.SPINNER),
	ERROR_DIALOG: getByDataCy(TRAVELLER_ITEM.ERROR_DIALOG),
	DELETE_DIALOG: getByDataCy(TRAVELLER_ITEM.DELETE_DIALOG),
	DELETE_CANCEL: getByDataCy(TRAVELLER_ITEM.DELETE_CANCEL),
	DELETE_CONFIRM: getByDataCy(TRAVELLER_ITEM.DELETE_CONFIRM),
	EDIT: getByDataCy(TRAVELLER_ITEM.EDIT),
}

export const YOU_TAG_SELECTORS = {
	ROOT: getByDataCy(YOU_TAG.ROOT),
}

export const TRAVELLER_CARD_HEAD_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_CARD_HEAD.ROOT),
}

export const PUBLIC_TRAVELLER_ITEM_SELECTORS = {
	ROOT: getByDataCy(PUBLIC_TRAVELLER_ITEM.ROOT),
	NAME: getByDataCy(PUBLIC_TRAVELLER_ITEM.NAME),
	TRIP: getByDataCy(PUBLIC_TRAVELLER_ITEM.TRIP),
	BADGES: getByDataCy(PUBLIC_TRAVELLER_ITEM.BADGES),
	COVER: getByDataCy(PUBLIC_TRAVELLER_ITEM.COVER),
	VIEW_TRIP: getByDataCy(PUBLIC_TRAVELLER_ITEM.VIEW_TRIP),
}

export const TRAVELLER_DETAIL_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_DETAIL.ROOT),
	LAYOUT: getByDataCy(TRAVELLER_DETAIL.LAYOUT),
	COLUMNS: getByDataCy(TRAVELLER_DETAIL.COLUMNS),
	NAME: getByDataCy(TRAVELLER_DETAIL.NAME),
	SPINNER: getByDataCy(TRAVELLER_DETAIL.SPINNER),
	NOT_FOUND: getByDataCy(TRAVELLER_DETAIL.NOT_FOUND),
	BACK_TO_TRAVELLERS: getByDataCy(TRAVELLER_DETAIL.BACK_TO_TRAVELLERS),
	PHOTOS_HEADING: getByDataCy(TRAVELLER_DETAIL.PHOTOS_HEADING),
	PROFILE: getByDataCy(TRAVELLER_DETAIL.PROFILE),
	TRIP_DESCRIPTION: getByDataCy(TRAVELLER_DETAIL.TRIP_DESCRIPTION),
	TRIP: getByDataCy(TRAVELLER_DETAIL.TRIP),
	BADGES: getByDataCy(TRAVELLER_DETAIL.BADGES),
	IMAGES_LIST: getByDataCy(TRAVELLER_DETAIL.IMAGES_LIST),
	MESSAGE: getByDataCy(TRAVELLER_DETAIL.MESSAGE),
	EDIT: getByDataCy(TRAVELLER_DETAIL.EDIT),
	ADD_PHOTOS: getByDataCy(TRAVELLER_DETAIL.ADD_PHOTOS),
	NO_PHOTOS: getByDataCy(TRAVELLER_DETAIL.NO_PHOTOS),
	SAVED_ALERT: getByDataCy(TRAVELLER_DETAIL.SAVED_ALERT),
}

export const EDIT_TRIP_SELECTORS = Object.fromEntries(
	Object.entries(EDIT_TRIP).map(([key, id]) => [key, getByDataCy(id)]),
)

export const TRIP_PHOTOS_SELECTORS = Object.fromEntries(
	Object.entries(TRIP_PHOTOS).map(([key, id]) => [key, getByDataCy(id)]),
)

export const TRAVELLER_FILTER_SELECTORS = {
	ROOT: getByDataCy(TRAVELLER_FILTER.ROOT),
	OPTION: getByDataCy(TRAVELLER_FILTER.OPTION),
	CHECKBOX: getByDataCy(TRAVELLER_FILTER.CHECKBOX),
	SEARCH: getByDataCy(TRAVELLER_FILTER.SEARCH),
	LIST: getByDataCy(TRAVELLER_FILTER.LIST),
	EMPTY: getByDataCy(TRAVELLER_FILTER.EMPTY),
	SHOW_ALL: getByDataCy(TRAVELLER_FILTER.SHOW_ALL),
	TRIGGER: getByDataCy(TRAVELLER_FILTER.TRIGGER),
	SHEET: getByDataCy(TRAVELLER_FILTER.SHEET),
	SHOW_MATCHES: getByDataCy(TRAVELLER_FILTER.SHOW_MATCHES),
	STATUS: getByDataCy(TRAVELLER_FILTER.STATUS),
}

export const TRAVELLERS_WELCOME_SELECTORS = {
	ROOT: getByDataCy(TRAVELLERS_WELCOME.ROOT),
	CREATE_ACCOUNT: getByDataCy(TRAVELLERS_WELCOME.CREATE_ACCOUNT),
	LOG_IN: getByDataCy(TRAVELLERS_WELCOME.LOG_IN),
}

export const CONTACT_TRAVELLER_SELECTORS = {
	ROOT: getByDataCy(CONTACT_TRAVELLER.ROOT),
	TITLE: getByDataCy(CONTACT_TRAVELLER.TITLE),
	FORM: getByDataCy(CONTACT_TRAVELLER.FORM),
	BACK_TO_MESSAGES: getByDataCy(CONTACT_TRAVELLER.BACK_TO_MESSAGES),
	REPLY_QUOTE: getByDataCy(CONTACT_TRAVELLER.REPLY_QUOTE),
	COLUMNS: getByDataCy(CONTACT_TRAVELLER.COLUMNS),
	RECIPIENT: getByDataCy(CONTACT_TRAVELLER.RECIPIENT),
	RECIPIENT_DETAILS: getByDataCy(CONTACT_TRAVELLER.RECIPIENT_DETAILS),
	VIEW_TRIP: getByDataCy(CONTACT_TRAVELLER.VIEW_TRIP),
	MESSAGE_INPUT: getByDataCy(CONTACT_TRAVELLER.MESSAGE_INPUT),
	MESSAGE_ERROR: getByDataCyError(CONTACT_TRAVELLER.MESSAGE_ERROR),
	SUBMIT: getByDataCy(CONTACT_TRAVELLER.SUBMIT),
	SENDING_DIALOG: getByDataCy(CONTACT_TRAVELLER.SENDING_DIALOG),
	ERROR_DIALOG: getByDataCy(CONTACT_TRAVELLER.ERROR_DIALOG),
}

export const MESSAGES_PAGE_SELECTORS = Object.fromEntries(
	Object.entries(MESSAGES_PAGE).map(([key, id]) => [key, getByDataCy(id)]),
)

export const MESSAGE_ITEM_SELECTORS = Object.fromEntries(
	Object.entries(MESSAGE_ITEM).map(([key, id]) => [key, getByDataCy(id)]),
)

export const PASSWORD_RESET_FORM_SELECTORS = Object.fromEntries(
	Object.entries(PASSWORD_RESET_FORM).map(([key, id]) => [
		key,
		key === 'EMAIL_ERROR' ? getByDataCyError(id) : getByDataCy(id),
	]),
)
