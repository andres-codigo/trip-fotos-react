import {
	getByDataCy,
	getByDataCyAlt,
} from '../../../testUtils/cypress/selectors'

/////
/// Page Selectors
/////
export const PAGE_SELECTORS = {
	TRAVELLERS_MAIN_CONTAINER: getByDataCyAlt('travellers-main-container'),
	MESSAGES_MAIN_CONTAINER: getByDataCyAlt('messages-main-container'),
	PRIVACY_MAIN_CONTAINER: getByDataCyAlt('privacy-main-container'),
	AUTHENTICATION_MAIN_CONTAINER: getByDataCyAlt(
		'authentication-main-container',
	),
	ACCOUNT_MAIN_CONTAINER: getByDataCyAlt('account-main-container'),
	PAGE_NOT_FOUND_MAIN_CONTAINER: getByDataCyAlt(
		'page-not-found-main-container',
	),
}

export const PAGE_NOT_FOUND_SELECTORS = {
	ACTION: getByDataCy('page-not-found-action'),
}
