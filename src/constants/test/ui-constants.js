export const AVATAR = Object.freeze({
	ROOT: 'initials-avatar',
})

export const BADGE = Object.freeze({
	ID: 'base-badge',
})

export const VERIFIED_CHIP = Object.freeze({
	ROOT: 'verified-chip',
})

export const BUTTON = Object.freeze({
	ID: 'test-button',
	MODE: {
		FLAT: 'flat',
		PRIMARY: 'primary',
		OUTLINE: 'outline',
		DANGER: 'danger',
	},
})

export const COMBOBOX = Object.freeze({
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
	TRACK: 'image-gallery-track',
	CAPTION: 'image-caption',
})

export const INPUT = Object.freeze({
	ID: 'test-input',
	PASSWORD_TOGGLE: 'password-toggle',
})

export const INLINE_ALERT = Object.freeze({
	ID: 'inline-alert',
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
	CLOSE: 'base-sheet-close',
	BODY: 'base-sheet-body',
	FOOTER: 'base-sheet-footer',
})

export const SPINNER = Object.freeze({
	ROLE_STATUS: 'status',
})

export const TEXTAREA = Object.freeze({
	ID: 'test-textarea',
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

export const YOU_TAG = Object.freeze({
	ROOT: 'you-tag',
})

export const TRAVELLER_CARD_HEAD = Object.freeze({
	ROOT: 'traveller-card-head',
})

export const PUBLIC_TRAVELLER_ITEM = Object.freeze({
	ROOT: 'public-traveller-item',
	NAME: 'public-traveller-item-name',
	TRIP: 'public-traveller-item-trip',
	EXCERPT: 'public-traveller-item-excerpt',
	BADGES: 'public-traveller-item-badges',
	PHOTOS: 'public-traveller-item-photos',
	VIEW_TRIP: 'public-traveller-item-view-trip',
})

export const TRAVELLER_SKELETON = Object.freeze({
	ROOT: 'traveller-skeleton',
	TEXT: 'traveller-skeleton-text',
	CHIP: 'traveller-skeleton-chip',
	PHOTOS: 'traveller-skeleton-photos',
	BUTTON: 'traveller-skeleton-button',
})

export const FILTER_SKELETON = Object.freeze({
	ROOT: 'filter-skeleton',
	INLINE: 'filter-skeleton-inline',
	SEARCH: 'filter-skeleton-search',
	TRIGGER: 'filter-skeleton-trigger',
})

export const TRAVELLERS_SKELETON = Object.freeze({
	ROOT: 'travellers-skeleton',
	LOADING: 'travellers-loading',
	LIST: 'travellers-skeleton-list',
})

export const TRAVELLERS_PAGE_SKELETON = Object.freeze({
	ROOT: 'travellers-page-skeleton',
})

export const MESSAGES_PAGE_SKELETON = Object.freeze({
	ROOT: 'messages-page-skeleton',
})

export const ACCOUNT_MENU = Object.freeze({
	ROOT: 'account-menu',
	BUTTON: 'account-menu-button',
	PANEL: 'account-menu-panel',
	SIGNED_IN_AS: 'account-menu-signed-in-as',
	EMAIL: 'account-menu-email',
	ACCOUNT_SETTINGS: 'account-menu-account-settings',
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
	LAYOUT: 'traveller-detail-layout',
	COLUMNS: 'traveller-detail-columns',
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
	LIST_CARD: 'messages-list-card',
	THREAD_CARD: 'messages-thread-card',
	THREAD_COLUMN: 'messages-thread-column',
	THREAD_ERROR: 'messages-thread-error',
	THREAD_TRY_AGAIN: 'messages-thread-try-again',
	EMPTY: 'messages-empty',
	BROWSE_TRAVELLERS: 'messages-browse-travellers',
	UNDO_TOAST: 'messages-undo-toast',
	ERROR_DIALOG: 'messages-error-dialog',
})

export const CONVERSATION_AVATAR = Object.freeze({
	ROOT: 'conversation-avatar',
})

export const CONVERSATION_ROW = Object.freeze({
	ROOT: 'conversation-row',
	LINK: 'conversation-row-link',
	NAME: 'conversation-row-name',
	TIME: 'conversation-row-time',
	PREVIEW: 'conversation-row-preview',
	DOT: 'conversation-row-dot',
})

export const CONVERSATION_LIST = Object.freeze({
	ROOT: 'conversation-list',
})

export const CONVERSATION_SKELETON = Object.freeze({
	LIST: 'conversation-skeleton-list',
	ROW: 'conversation-skeleton-row',
	THREAD: 'conversation-skeleton-thread',
	HEADER: 'conversation-skeleton-header',
})

export const THREAD_HEADER = Object.freeze({
	ROOT: 'thread-header',
	BACK: 'thread-header-back',
	NAME: 'thread-header-name',
	NAME_LINK: 'thread-header-name-link',
	SUBTITLE: 'thread-header-subtitle',
	MENU_BUTTON: 'thread-header-menu-button',
	MENU: 'thread-header-menu',
	VIEW_CARD: 'thread-header-view-card',
	DELETE: 'thread-header-delete',
})

export const MESSAGE_BUBBLE = Object.freeze({
	ROOT: 'message-bubble',
	TEXT: 'message-bubble-text',
	TIME: 'message-bubble-time',
	SENDING: 'message-bubble-sending',
	FAILED: 'message-bubble-failed',
	TRY_AGAIN: 'message-bubble-try-again',
})

export const MESSAGE_THREAD = Object.freeze({
	ROOT: 'message-thread',
	DAY: 'message-thread-day',
	NEW_DIVIDER: 'message-thread-new',
	HELLO: 'message-thread-hello',
})

export const REPLY_BOX = Object.freeze({
	ROOT: 'reply-box',
	INPUT: 'reply-box-input',
	SEND: 'reply-box-send',
})

export const THREAD_NOTE = Object.freeze({
	ROOT: 'thread-note',
	EMAIL: 'thread-note-email',
	REPLY_BY_EMAIL: 'thread-note-reply-by-email',
})

export const PASSWORD_RESET_FORM = Object.freeze({
	ROOT: 'password-reset-form',
	EMAIL_INPUT: 'password-reset-email-input',
	EMAIL_ERROR: 'password-reset-email-error',
	SUBMIT: 'password-reset-submit',
	SENT: 'password-reset-sent',
	SENT_MESSAGE: 'password-reset-sent-message',
})

export const CHANGE_PASSWORD_FORM = Object.freeze({
	ROOT: 'change-password-form',
	CURRENT_PASSWORD_INPUT: 'change-password-current-input',
	CURRENT_PASSWORD_ERROR: 'change-password-current-error',
	NEW_PASSWORD_INPUT: 'change-password-new-input',
	NEW_PASSWORD_ERROR: 'change-password-new-error',
	CANCEL: 'change-password-cancel',
	SAVE_PASSWORD: 'change-password-save-password',
	ALERT: 'change-password-alert',
})

export const CHANGE_EMAIL_FORM = Object.freeze({
	ROOT: 'change-email-form',
	NEW_EMAIL_INPUT: 'change-email-new-input',
	NEW_EMAIL_ERROR: 'change-email-new-error',
	CURRENT_PASSWORD_INPUT: 'change-email-current-input',
	CURRENT_PASSWORD_ERROR: 'change-email-current-error',
	SEND_LINK: 'change-email-send-link',
	ALERT: 'change-email-alert',
})

export const NEW_PASSWORD_FORM = Object.freeze({
	ROOT: 'new-password-form',
	TITLE: 'new-password-title',
	FOR: 'new-password-for',
	PASSWORD_INPUT: 'new-password-input',
	PASSWORD_ERROR: 'new-password-error',
	SAVE_PASSWORD: 'new-password-save-password',
})

export const AUTH_ACTION_PAGE = Object.freeze({
	VIEW: 'auth-action-view',
	TITLE: 'auth-action-title',
	TICK: 'auth-action-tick',
	ALERT: 'auth-action-alert',
	EXPIRED_SENT: 'auth-action-expired-sent',
	LOG_IN: 'auth-action-log-in',
	SEND_NEW_LINK: 'auth-action-send-new-link',
	TRY_AGAIN: 'auth-action-try-again',
	RESET_PASSWORD: 'auth-action-reset-password',
	EMAIL: 'auth-action-email',
})

export const ACCOUNT_PAGE = Object.freeze({
	TITLE: 'account-title',
	EMAIL_SECTION: 'account-email-section',
	EMAIL: 'account-email',
	EMAIL_MESSAGE: 'account-email-message',
	SEND_AGAIN: 'account-send-again',
	PASSWORD_SECTION: 'account-password-section',
	CHANGE_PASSWORD: 'account-change-password',
	PASSWORD_CHANGED: 'account-password-changed',
	CHANGE_EMAIL: 'account-change-email',
	EMAIL_SENT: 'account-email-sent',
	EMAIL_SENT_HINT: 'account-email-sent-hint',
	EMAIL_SEND_AGAIN: 'account-email-send-again',
	EMAIL_SENT_ERROR: 'account-email-sent-error',
})

export const VERIFY_EMAIL_INBOX = Object.freeze({
	ROOT: 'verify-email-inbox',
	STATUS: 'verify-email-inbox-status',
	ERROR: 'verify-email-inbox-error',
	SEND_AGAIN: 'verify-email-inbox-send-again',
	CHECK: 'verify-email-inbox-check',
})

export const VERIFY_EMAIL_STRIP = Object.freeze({
	ROOT: 'verify-email-strip',
	EMAIL: 'verify-email-strip-email',
	MESSAGE: 'verify-email-strip-message',
	SEND_AGAIN: 'verify-email-strip-send-again',
	CHECK: 'verify-email-strip-check',
	BUSY: 'verify-email-strip-busy',
})

export const VERIFY_EMAIL_NOTE = Object.freeze({
	ROOT: 'verify-email-note',
	TITLE: 'verify-email-note-title',
	MESSAGE: 'verify-email-note-message',
	SEND_AGAIN: 'verify-email-note-send-again',
	CHECK: 'verify-email-note-check',
	BUSY: 'verify-email-note-busy',
})
