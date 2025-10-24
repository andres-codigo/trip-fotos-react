import {
	getByDataCy,
	getByDataCyAlt,
} from '../../../../src/testUtils/cypress/selectors'

/////
/// Page Selectors
/////
export const pageSelectors = {
	mainContainer: getByDataCy('main-container'),
	homePage: getByDataCyAlt('home-main-container'),
	travellersPage: getByDataCyAlt('travellers-main-container'),
	messagesPage: getByDataCyAlt('messages-main-container'),
	authenticationPage: getByDataCyAlt('authentication-main-container'),
	pageNotFoundPage: getByDataCyAlt('page-not-found-main-container'),
}

export const pageNotFoundSelectors = {
	homeLink: getByDataCy('home-link'),
}
