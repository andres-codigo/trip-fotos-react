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
		DANGER_OUTLINE: 'dangerOutline',
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

export const ERROR_SUMMARY = Object.freeze({
	ROOT: 'error-summary',
	LINK: 'error-summary-link',
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
	ALT_INPUT: 'file-preview-alt',
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
	CAPTION: 'image-caption',
})

export const INPUT = Object.freeze({
	ID: 'test-input',
	ERROR_ID: 'test-input-error',
	TYPES: ['text', 'password', 'email', 'number'],
	PASSWORD_TOGGLE: 'password-toggle',
})

export const PROGRESS = Object.freeze({
	ID: 'base-progress',
	BAR: 'base-progress-bar',
	LABEL: 'base-progress-label',
})

export const REQUIRED_LEGEND = Object.freeze({
	ROOT: 'required-legend',
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
		REGISTER_AS_TRAVELLER: 'Register as a traveller',
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
	MESSAGE: 'traveller-item-message',
	VIEW_TRIP: 'traveller-item-view-trip',
	DELETE: 'traveller-item-delete',
	SPINNER: 'traveller-item-spinner',
	ERROR_DIALOG: 'traveller-item-error-dialog',
	DELETE_DIALOG: 'traveller-item-delete-dialog',
	DELETE_CANCEL: 'traveller-item-delete-cancel',
	DELETE_CONFIRM: 'traveller-item-delete-confirm',
	EDIT: 'traveller-item-edit',
})

export const PUBLIC_TRAVELLER_ITEM = Object.freeze({
	ROOT: 'public-traveller-item',
	NAME: 'public-traveller-item-name',
	TRIP: 'public-traveller-item-trip',
	BADGES: 'public-traveller-item-badges',
	COVER: 'public-traveller-item-cover',
	VIEW_TRIP: 'public-traveller-item-view-trip',
})

export const TRAVELLER_SKELETON = Object.freeze({
	ROOT: 'traveller-skeleton',
})

export const MESSAGE_SKELETON = Object.freeze({
	ROOT: 'message-skeleton',
})

export const ACCOUNT_MENU = Object.freeze({
	ROOT: 'account-menu',
	BUTTON: 'account-menu-button',
	PANEL: 'account-menu-panel',
	SIGNED_IN_AS: 'account-menu-signed-in-as',
	LOG_OUT: 'account-menu-log-out',
})

export const TAB_BAR = Object.freeze({
	ROOT: 'tab-bar',
	TRAVELLERS: 'tab-bar-travellers',
	MESSAGES: 'tab-bar-messages',
	MY_TRIP: 'tab-bar-my-trip',
	REGISTER: 'tab-bar-register',
	UNREAD: 'tab-bar-unread',
	SPACER: 'tab-bar-spacer',
})

export const TRAVELLER_DETAIL = Object.freeze({
	ROOT: 'traveller-detail',
	NAME: 'traveller-detail-name',
	SPINNER: 'traveller-detail-spinner',
	NOT_FOUND: 'traveller-detail-not-found',
	BACK_TO_TRAVELLERS: 'traveller-detail-back-to-travellers',
	PHOTOS_HEADING: 'traveller-detail-photos-heading',
	PROFILE: 'traveller-detail-profile',
	TRIP_DESCRIPTION: 'traveller-detail-trip-description',
	TRIP: 'traveller-detail-trip',
	BADGES: 'traveller-detail-badges',
	IMAGES_LIST: 'traveller-detail-images',
	MESSAGE: 'traveller-detail-message',
	EDIT: 'traveller-detail-edit',
	ADD_PHOTOS: 'traveller-detail-add-photos',
	NO_PHOTOS: 'traveller-detail-no-photos',
	SAVED_ALERT: 'traveller-detail-saved-alert',
})

export const EDIT_TRIP = Object.freeze({
	ROOT: 'edit-trip',
	BACK_TO_TRIP: 'edit-trip-back-to-trip',
	CANCEL: 'edit-trip-cancel',
	SAVING_DIALOG: 'edit-trip-saving-dialog',
	ERROR_DIALOG: 'edit-trip-error-dialog',
	DELETE_SECTION: 'edit-trip-delete-section',
	DELETE: 'edit-trip-delete',
	DELETE_DIALOG: 'edit-trip-delete-dialog',
	DELETE_CANCEL: 'edit-trip-delete-cancel',
	DELETE_CONFIRM: 'edit-trip-delete-confirm',
	DELETING: 'edit-trip-deleting',
})

export const TRIP_PHOTOS = Object.freeze({
	ROOT: 'trip-photos',
	COUNT: 'trip-photos-count',
	TILE: 'trip-photos-tile',
	REMOVE: 'trip-photos-remove',
	REMOVED: 'trip-photos-removed',
	UNDO: 'trip-photos-undo',
	LAST_PHOTO_HINT: 'trip-photos-last-photo-hint',
	ALT_INPUT: 'trip-photos-alt',
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

export const TRAVELLERS_WELCOME = Object.freeze({
	ROOT: 'travellers-welcome',
	CREATE_ACCOUNT: 'travellers-welcome-create-account',
	LOG_IN: 'travellers-welcome-log-in',
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

export const PASSWORD_RESET_FORM = Object.freeze({
	ROOT: 'password-reset-form',
	TITLE: 'password-reset-title',
	BACK_TO_LOG_IN: 'password-reset-back-to-log-in',
	EMAIL_INPUT: 'password-reset-email-input',
	EMAIL_ERROR: 'password-reset-email-error',
	SEND_ERROR: 'password-reset-send-error',
	SUBMIT: 'password-reset-submit',
	SENT: 'password-reset-sent',
	SENT_MESSAGE: 'password-reset-sent-message',
	SEND_AGAIN: 'password-reset-send-again',
	BACK: 'password-reset-back',
})
