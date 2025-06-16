import { getByDataCy } from '../../../src/testUtils/cypress/selectors'

export const dialog = {
	// Dialog
	invalidEmailOrPassword: getByDataCy('invalid-email-or-password-dialog'),
	loading: getByDataCy('loading-dialog'),
	// Dialog elements
	title: getByDataCy('title'),
	textContent: getByDataCy('text-content'),
	spinnerContainer: getByDataCy('base-spinner'),
	spinnerImage: getByDataCy('base-spinner-img'),
}

export const dialogMessages = {
	loading: {
		title: 'Authenticating',
		text: 'Authenticating your details, one moment please...',
	},
	error: {
		title: 'An error occurred',
	},
}
