export const BADGE = Object.freeze({
	ID: 'base-badge',
})

export const BUTTON = Object.freeze({
	ID: 'test-button',
	LINK_ID: 'test-link',
	MODE: {
		FLAT: 'flat',
		OUTLINED: 'outlined',
		FILLED: 'filled',
	},
})

export const COMBOBOX = Object.freeze({
	ID: 'test-combobox',
	INPUT: 'combobox-input',
	LISTBOX: 'combobox-listbox',
	OPTION: 'combobox-option',
	STATUS: 'combobox-status',
})

export const DIALOG = Object.freeze({
	ID: 'test-dialog',
	BACKDROP: 'dialog-backdrop',
	TITLE: 'title',
	TEXT_CONTENT: 'text-content',
	BUTTON: 'dialog-button',
	ROLE_DIALOG: 'dialog',
	ROLE_ALERTDIALOG: 'alertdialog',
})

export const FILE_DROP = Object.freeze({
	ID: 'file-drop',
	INPUT: 'file-drop-input',
	LIST: 'file-drop-list',
	ERRORS: 'file-drop-errors',
})

export const FILE_PREVIEW = Object.freeze({
	ID: 'file-preview',
	REMOVE_BUTTON: 'file-preview-remove',
	THUMBNAIL: 'file-preview-thumbnail',
	NAME: 'file-preview-name',
	STATUS: 'file-preview-status',
})

export const IMAGE = Object.freeze({
	ID: 'base-image',
	BUTTON: 'base-image-button',
	THUMBNAIL: 'base-image-thumbnail',
	FULL: 'base-image-full',
	FALLBACK: 'base-image-fallback',
})

export const INPUT = Object.freeze({
	ID: 'test-input',
	ERROR_ID: 'test-input-error',
	TYPES: ['text', 'password', 'email', 'number'],
})

export const SPINNER = Object.freeze({
	MOCK_SVG: 'mock-spinner.svg',
	ROLE_STATUS: 'status',
})

export const TEXTAREA = Object.freeze({
	ID: 'test-textarea',
	ERROR_ID: 'test-textarea-error',
})

export const UI_TEXT = {
	TRAVELLERS: {
		NO_TRAVELLERS_MESSAGE: 'No travellers listed.',
		NO_MATCHING_MESSAGE: 'No travellers match the selected cities.',
		REGISTER_AS_TRAVELLER: 'Register',
		REFRESH_BUTTON: 'Refresh',
	},
	BUTTONS: {
		CLOSE: 'Close',
		REFRESH: 'Refresh',
	},
	FORMS: {
		REGISTER_AS_TRAVELLER: 'Register as a Traveller',
		CITIES_VISITED: 'Cities visited',
	},
}

export const TRAVELLER_ITEM = Object.freeze({
	ROOT: 'traveller-item',
	NAME: 'traveller-item-name',
	REGISTERED: 'traveller-item-registered',
	DESCRIPTION: 'traveller-item-description',
	DAYS: 'traveller-item-days',
	BADGES: 'traveller-item-badges',
	IMAGES_LIST: 'traveller-item-images',
	SEE_ALL_LINK: 'traveller-item-see-all',
	CONTACT: 'traveller-item-contact',
	DETAILS: 'traveller-item-details',
	DELETE: 'traveller-item-delete',
	SPINNER: 'traveller-item-spinner',
	ERROR_DIALOG: 'traveller-item-error-dialog',
})

export const TRAVELLER_DETAIL = Object.freeze({
	ROOT: 'traveller-detail',
	NAME: 'traveller-detail-name',
	SPINNER: 'traveller-detail-spinner',
	NOT_FOUND: 'traveller-detail-not-found',
	BACK_LINK: 'traveller-detail-back',
	PROFILE: 'traveller-detail-profile',
	DESCRIPTION: 'traveller-detail-description',
	DAYS: 'traveller-detail-days',
	BADGES: 'traveller-detail-badges',
	IMAGES_LIST: 'traveller-detail-images',
	CONTACT_SECTION: 'traveller-detail-contact-section',
	CONTACT: 'traveller-detail-contact',
})

export const TRAVELLER_FILTER = Object.freeze({
	ROOT: 'traveller-filter',
	OPTION: 'traveller-filter-option',
	CHECKBOX: 'traveller-filter-checkbox',
})
