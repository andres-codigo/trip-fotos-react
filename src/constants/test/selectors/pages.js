import {
	getByDataCy,
	getByDataCyAlt,
} from '../../../testUtils/cypress/selectors'

/////
/// Page Selectors
/////
export const PAGE_SELECTORS = {
	MAIN_CONTAINER: getByDataCy('main-container'),
	HOME_MAIN_CONTAINER: getByDataCyAlt('home-main-container'),
	TRAVELLERS_MAIN_CONTAINER: getByDataCyAlt('travellers-main-container'),
	MESSAGES_MAIN_CONTAINER: getByDataCyAlt('messages-main-container'),
	AUTHENTICATION_MAIN_CONTAINER: getByDataCyAlt(
		'authentication-main-container',
	),
	REGISTER_MAIN_CONTAINER: getByDataCyAlt('register-main-container'),
	PAGE_NOT_FOUND_MAIN_CONTAINER: getByDataCyAlt(
		'page-not-found-main-container',
	),
}

export const PAGE_NOT_FOUND_SELECTORS = {
	HOME_LINK: getByDataCy('home-link'),
}
