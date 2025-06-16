import { mount } from 'cypress/react'
import configureStore from 'redux-mock-store'

import { mountWithProviders } from './commands-support-files/mountWithProviders'

import { viewports } from './constants/viewports'

import {
	headerSelectors,
	topNavigationSelectors,
	authenticationFormSelectors,
} from './constants/selectors'

const mockStore = configureStore([])
////
// HELPERS
////
Cypress.Commands.add('createMockStore', (authToken = null) => {
	return mockStore({
		authentication: { token: authToken },
	})
})

Cypress.Commands.add('mountWithProviders', (ui, store) => {
	mount(mountWithProviders(ui, store))
})

////
// LOGIN
////
Cypress.Commands.add('login', (email, password) => {
	cy.get(authenticationFormSelectors.emailInput).type(email)
	cy.get(authenticationFormSelectors.passwordInput).type(password)
	cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
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
		cy.viewport(viewports.mobile.width, win.innerHeight)
	})
})

Cypress.Commands.add('setViewportToTablet', () => {
	cy.window().then((win) => {
		cy.viewport(viewports.tablet.width, win.innerHeight)
	})
})

Cypress.Commands.add('setViewportToDesktop', () => {
	cy.window().then((win) => {
		cy.viewport(viewports.desktop.width, win.innerHeight)
	})
})

////
// HEADER
////
Cypress.Commands.add('assertHeaderTitleLink', () => {
	cy.get(headerSelectors.siteHeaderTitleLink)
		.find('a')
		.then(($siteHeaderTitleLink) => {
			expect($siteHeaderTitleLink.text()).to.equal('Trip Fotos')
		})
})

////
// TOP NAVIGATION HAMBURGER MENU
////
Cypress.Commands.add('assertHamburgerMenuState', (isActive) => {
	cy.get(topNavigationSelectors.navHamburgerMenu)
		.invoke('attr', 'class')
		.should(isActive ? 'contain' : 'not.contain', '_active_')
})
