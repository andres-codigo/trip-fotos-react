import { getByDataCy } from '../../../../src/testUtils/cypress/selectors'

export const DIALOG_SELECTORS = {
	// Dialog
	INVALID_EMAIL_OR_PASSWORD: getByDataCy('invalid-email-or-password-dialog'),
	AUTHENTICATING: getByDataCy('authenticating-dialog'),
	TRAVELLERS_LIST_ERROR: getByDataCy('travellers-list-error-dialog'),
	// Dialog elements
	TITLE: getByDataCy('title'),
	TEXT_CONTENT: getByDataCy('text-content'),
	SPINNER_CONTAINER: getByDataCy('base-spinner'),
	SPINNER_IMAGE: getByDataCy('base-spinner-img'),
}

export const DIALOG_MESSAGES = {
	LOADING: {
		TITLE: 'Authenticating',
		TEXT: 'Authenticating your details, one moment please...',
	},
	ERROR: {
		TITLE: 'An error occurred',
	},
}
