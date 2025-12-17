import { mount } from 'cypress/react'
import configureStore from 'redux-mock-store'

import { mountWithProviders } from './commands-support-files/mountWithProviders'

import {
	HEADER_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	AUTHENTICATION_FORM_SELECTORS,
} from '../../src/constants/test/selectors/components'
import { TEST_USER } from '../../src/constants/config/users'
import { VIEWPORTS } from '../../src/constants/config/viewports'

const mockStore = configureStore([])
////
// HELPERS
////
Cypress.Commands.add('createMockStore', (authToken = null) => {
	return mockStore({
		authentication: {
			token: authToken,
			userId: TEST_USER.MOCK_USER_ID,
			userName: TEST_USER.MOCK_NAME,
			userEmail: TEST_USER.VALID_EMAIL,
			didAutoLogout: false,
		},
		travellers: {
			travellerName: '',
			isTraveller: false,
			hasTravellers: false,
			travellers: [],
			lastFetch: null,
			status: 'idle',
			error: null,
		},
	})
})

Cypress.Commands.add('mountWithProviders', (ui, store) => {
	mount(mountWithProviders(ui, store))
})

////
// LOGIN
////
Cypress.Commands.add('login', (email, password) => {
	cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(email)
	cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(password)
	cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
})

////
//INTERCEPTORS
////

// Intercept successful login requests
Cypress.Commands.add('interceptLogin', (method, url) => {
	cy.intercept(method, url).as('loginRequest')
})

// Intercept error login requests with a specific error message response
Cypress.Commands.add('interceptLoginError', (method, url, message) => {
	cy.intercept(method, url, {
		statusCode: 400,
		body: {
			error: {
				message,
			},
		},
	}).as('loginErrorRequest')
})

// Intercept login requests with a delay
Cypress.Commands.add('interceptDelayedLogin', (method, url, time) => {
	cy.intercept(method, url, (req) => {
		req.on('response', (res) => {
			res.setDelay(time)
		})
	}).as('delayedLogin')
})

////
// VIEWPORTS
////
Cypress.Commands.add('setViewportToMobile', () => {
	cy.window().then((win) => {
		cy.viewport(VIEWPORTS.MOBILE.WIDTH, win.innerHeight)
	})
})

Cypress.Commands.add('setViewportToTablet', () => {
	cy.window().then((win) => {
		cy.viewport(VIEWPORTS.TABLET.WIDTH, win.innerHeight)
	})
})

Cypress.Commands.add('setViewportToDesktop', () => {
	cy.window().then((win) => {
		cy.viewport(VIEWPORTS.DESKTOP.WIDTH, win.innerHeight)
	})
})

////
// HEADER
////
Cypress.Commands.add('assertHeaderTitleLink', () => {
	cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK)
		.find('a')
		.then(($siteHeaderTitleLink) => {
			expect($siteHeaderTitleLink.text()).to.equal('Trip Fotos')
		})
})

////
// TOP NAVIGATION HAMBURGER MENU
////
Cypress.Commands.add('assertHamburgerMenuState', (isActive) => {
	cy.get(TOP_NAVIGATION_SELECTORS.HAMBURGER_MENU)
		.invoke('attr', 'class')
		.should(isActive ? 'contain' : 'not.contain', '_active_')
})
