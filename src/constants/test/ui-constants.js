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

export const SHEET = Object.freeze({
	ID: 'base-sheet',
	BACKDROP: 'base-sheet-backdrop',
	TITLE: 'base-sheet-title',
	CLOSE: 'base-sheet-close',
	BODY: 'base-sheet-body',
	FOOTER: 'base-sheet-footer',
})

export const SPINNER = Object.freeze({
	ROLE_STATUS: 'status',
})

export const TEXTAREA = Object.freeze({
	ID: 'test-textarea',
	ERROR_ID: 'test-textarea-error',
})

export const TOAST = Object.freeze({
	ROOT: 'toast',
	MESSAGE: 'toast-message',
	ACTION: 'toast-action',
	DISMISS: 'toast-dismiss',
})

export const UI_TEXT = {
	TRAVELLERS: {
		NO_TRAVELLERS_MESSAGE: 'No travellers listed.',
		REGISTER_AS_TRAVELLER: 'Register',
		REFRESH_BUTTON: 'Refresh travellers',
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
	TRIP_DESCRIPTION: 'traveller-item-trip-description',
	TRIP: 'traveller-item-trip',
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

export const TRAVELLER_SKELETON = Object.freeze({
	ROOT: 'traveller-skeleton',
})

export const MESSAGE_SKELETON = Object.freeze({
	ROOT: 'message-skeleton',
})

export const TRAVELLER_DETAIL = Object.freeze({
	ROOT: 'traveller-detail',
	NAME: 'traveller-detail-name',
	SPINNER: 'traveller-detail-spinner',
	NOT_FOUND: 'traveller-detail-not-found',
	BACK_LINK: 'traveller-detail-back',
	PROFILE: 'traveller-detail-profile',
	TRIP_DESCRIPTION: 'traveller-detail-trip-description',
	TRIP: 'traveller-detail-trip',
	BADGES: 'traveller-detail-badges',
	IMAGES_LIST: 'traveller-detail-images',
	CONTACT_SECTION: 'traveller-detail-contact-section',
	CONTACT: 'traveller-detail-contact',
})

export const CONTACT_TRAVELLER = Object.freeze({
	ROOT: 'contact-traveller',
	TITLE: 'contact-traveller-title',
	FORM: 'contact-traveller-form',
	BACK_TO_MESSAGES: 'contact-back-to-messages',
	REPLY_QUOTE: 'contact-reply-quote',
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
	SEARCH: 'traveller-filter-search',
	LIST: 'traveller-filter-list',
	EMPTY: 'traveller-filter-empty',
	SHOW_ALL: 'traveller-filter-show-all',
	TRIGGER: 'traveller-filter-trigger',
	SHEET: 'traveller-filter-sheet',
	SHOW_MATCHES: 'traveller-filter-show-matches',
	STATUS: 'traveller-filter-status',
})

export const MESSAGES_PAGE = Object.freeze({
	LOADING: 'messages-loading',
	SUMMARY: 'messages-summary',
	LIST: 'messages-list',
	EMPTY: 'messages-empty',
	BROWSE_TRAVELLERS: 'messages-browse-travellers',
	UNDO_TOAST: 'messages-undo-toast',
	ERROR_DIALOG: 'messages-error-dialog',
})

export const MESSAGE_ITEM = Object.freeze({
	ROOT: 'message-item',
	SENDER: 'message-item-sender',
	SENDER_LINK: 'message-item-sender-link',
	NEW_TAG: 'message-item-new',
	TIME: 'message-item-time',
	TEXT: 'message-item-text',
	SHOW_ALL: 'message-item-show-all',
	REPLY: 'message-item-reply',
	DELETE: 'message-item-delete',
	DELETE_ERROR: 'message-item-delete-error',
	TRY_AGAIN: 'message-item-try-again',
})
