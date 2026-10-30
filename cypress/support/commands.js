import { mount } from 'cypress/react'
import { configureStore } from '@reduxjs/toolkit'

import { mountWithProviders } from './commands-support-files/mountWithProviders'

import {
	HEADER_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	AUTHENTICATION_FORM_SELECTORS,
	COMBOBOX_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
} from '../../src/constants/test/selectors/components'
import { MOCK_PHOTON_TOKYO_RESPONSE } from '../../src/constants/test/mock-data/mock-travellers'
import { TEST_USERS } from '../../src/constants/config/users'
import { VIEWPORTS } from '../../src/constants/config/viewports'

////
// HELPERS
////
Cypress.Commands.add('createMockStore', (authToken = null) => {
	return configureStore({
		reducer: {
			authentication: (state = {}) => state,
			travellers: (state = {}) => state,
			messages: (state = {}) => state,
		},
		preloadedState: {
			authentication: {
				token: authToken,
				userId: TEST_USERS.STANDARD.ID,
				userName: TEST_USERS.STANDARD.NAME,
				userEmail: TEST_USERS.STANDARD.EMAIL,
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
			messages: {
				messages: [],
				status: 'idle',
				error: null,
			},
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

// The app checks traveller registration against the database; specs sign in as a seeded account, so only a spec that needs another answer pins it
Cypress.Commands.add('stubTravellerCheck', (isTraveller = false) => {
	cy.intercept(
		{
			method: 'GET',
			pathname: '/travellers/*.json',
			query: { shallow: 'true' },
		},
		isTraveller ? { body: { registered: true } } : 'null',
	).as('travellerCheck')
})

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
// CITY SEARCH
////
// Stubs the city search API so tests do not depend on Photon's live results
Cypress.Commands.add(
	'selectCity',
	(query = 'tok', response = MOCK_PHOTON_TOKYO_RESPONSE) => {
		cy.intercept(
			{ method: 'GET', hostname: 'photon.komoot.io' },
			{ statusCode: 200, body: response },
		).as('citySearch')
		cy.get(COMBOBOX_SELECTORS.INPUT).type(query)
		cy.wait('@citySearch')
		cy.get(COMBOBOX_SELECTORS.OPTION).first().click()
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITY).should(
			'exist',
		)
	},
)

////
// STORAGE CLEANUP
////
// Uploads get a unique path per run, so each test must remove its own;
// the signed-in user's ID token satisfies the owner-delete Storage rule
Cypress.Commands.add('deleteStorageObject', (downloadUrl) => {
	const { origin, pathname } = new URL(downloadUrl)

	cy.window().then((win) => {
		cy.request({
			method: 'DELETE',
			url: `${origin}${pathname}`,
			headers: {
				Authorization: `Firebase ${win.localStorage.getItem('token')}`,
			},
		})
			.its('status')
			.should('eq', 204)
	})
})

// Back to the seed data for specs that write
Cypress.Commands.add('resetEmulators', () => {
	cy.task('seedEmulators')
	// The seed recreates the users, which invalidates their cached sessions
	Cypress.session.clearAllSavedSessions()
})

// Reads the record back from the emulator, so a pass means the write reached the database
Cypress.Commands.add('assertTravellerPersisted', (uid, expected) => {
	cy.request(
		`${Cypress.expose('VITE_DATABASE_URL')}/travellers/${uid}.json?ns=${Cypress.expose('VITE_DATABASE_NAMESPACE')}`,
	)
		.its('body')
		.should('include', expected)
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

////
// ACCESSIBILITY
////
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Read from disk, not imported: the E2E bundler breaks axe's source ("exports is not defined").
// Injected into the app's window so axe audits the app's own document
Cypress.Commands.add('checkA11y', (context, options = {}) => {
	cy.readFile('node_modules/axe-core/axe.min.js', null, { log: false })
		.then((source) =>
			cy.window({ log: false }).then((win) => {
				if (!win.axe) win.eval(Cypress.Buffer.from(source).toString())
				return win
			}),
		)
		.then((win) =>
			win.axe.run(context ?? win.document, {
				runOnly: { type: 'tag', values: WCAG_AA_TAGS },
				...options,
			}),
		)
		.then(({ violations }) => {
			const summary = violations
				.map(
					({ id, impact, help, nodes }) =>
						`${id} (${impact}): ${help} — ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
				)
				.join('\n')
			expect(violations, summary).to.have.length(0)
		})
})
