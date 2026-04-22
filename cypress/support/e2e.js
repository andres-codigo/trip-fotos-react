// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

const clearBrowserCache = () => {
	if (Cypress.browser.family !== 'chromium') {
		return
	}

	return Cypress.automation('remote:debugger:protocol', {
		command: 'Network.clearBrowserCache',
	})
}

const disableBrowserCache = () => {
	if (Cypress.browser.family !== 'chromium') {
		return
	}

	return Cypress.automation('remote:debugger:protocol', {
		command: 'Network.setCacheDisabled',
		params: {
			cacheDisabled: true,
		},
	})
}

beforeEach(() => {
	cy.then(() => disableBrowserCache())
	cy.clearAllCookies()
	cy.clearAllLocalStorage()
	cy.clearAllSessionStorage()
	cy.then(() => clearBrowserCache())
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
