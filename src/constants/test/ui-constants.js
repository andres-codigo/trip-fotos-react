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
		PRIMARY: 'primary',
		OUTLINE: 'outline',
		DANGER: 'danger',
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
	PREVIOUS: 'image-gallery-previous',
	NEXT: 'image-gallery-next',
	COUNTER: 'image-gallery-counter',
})

export const INPUT = Object.freeze({
	ID: 'test-input',
	ERROR_ID: 'test-input-error',
	TYPES: ['text', 'password', 'email', 'number'],
})

export const PROGRESS = Object.freeze({
	ID: 'base-progress',
	BAR: 'base-progress-bar',
	LABEL: 'base-progress-label',
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
	DELETE_DIALOG: 'traveller-item-delete-dialog',
	DELETE_CANCEL: 'traveller-item-delete-cancel',
	DELETE_CONFIRM: 'traveller-item-delete-confirm',
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

export const CONTACT_TRAVELLER = Object.freeze({
	ROOT: 'contact-traveller',
	TITLE: 'contact-traveller-title',
	FORM: 'contact-traveller-form',
	EMAIL_INPUT: 'contact-email-input',
	EMAIL_ERROR: 'contact-email-error-message',
	MESSAGE_INPUT: 'contact-message-input',
	MESSAGE_ERROR: 'contact-message-error-message',
	SUBMIT: 'contact-submit-button',
	SENDING_DIALOG: 'contact-sending-dialog',
	ERROR_DIALOG: 'contact-error-dialog',
})

export const TRAVELLER_FILTER = Object.freeze({
	ROOT: 'traveller-filter',
	OPTION: 'traveller-filter-option',
	CHECKBOX: 'traveller-filter-checkbox',
})

export const MESSAGES_PAGE = Object.freeze({
	SPINNER: 'messages-spinner',
	LIST: 'messages-list',
	EMPTY: 'messages-empty',
	ERROR_DIALOG: 'messages-error-dialog',
})

export const MESSAGE_ITEM = Object.freeze({
	ROOT: 'message-item',
	EMAIL: 'message-item-email',
	TEXT: 'message-item-text',
	DELETE: 'message-item-delete',
	SPINNER: 'message-item-spinner',
	ERROR_DIALOG: 'message-item-error-dialog',
})
