import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { AUTHENTICATION_FORM_SELECTORS } from '../../../src/constants/test/selectors/components'
import { ACCOUNT_MENU_SELECTORS } from '../../../src/constants/test/selectors/components'
import { TEST_USERS } from '../../../src/constants/config/users'

import { hasSdkSession, performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000

describe('App Routing', () => {
	it('redirects unauthenticated users from protected routes to login, keeping the page to return to', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.MESSAGES)
		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
		cy.location('search').should(
			'eq',
			`?redirect=${encodeURIComponent(PATHS.MESSAGES)}`,
		)
	})

	it('lets unauthenticated users open the public travellers list', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS)
		cy.location('pathname').should('eq', PATHS.TRAVELLERS)
	})

	it('sends everyone from home to the travellers list', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.HOME)
		cy.location('pathname').should('eq', PATHS.TRAVELLERS)
	})

	it('allows access to the authentication page', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'exist',
		)
	})

	it('redirects to home after successful login', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		).as('loginRequest')
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.STANDARD.PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
		cy.url({ timeout: REQUEST_TIMEOUT }).should('include', PATHS.HOME)
	})

	it('allows access to protected routes after login', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		).as('loginRequest')
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)

		cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
		// The Auth SDK makes a follow-up call before the session is stored, so a reload any sooner logs the user out
		cy.window({ timeout: REQUEST_TIMEOUT }).should((win) => {
			expect(
				hasSdkSession(
					{ ...win.localStorage },
					TEST_USERS.STANDARD.EMAIL,
				),
			).to.equal(true)
		})
		cy.visit(BASE_URL_CYPRESS + PATHS.MESSAGES)

		cy.url().should('include', PATHS.MESSAGES)
	})

	it('redirects a protected route to the authentication page after logout', () => {
		performLogin()
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
		cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).click()
		cy.url().should('include', PATHS.AUTHENTICATION)

		cy.visit(BASE_URL_CYPRESS + PATHS.MESSAGES)
		cy.url().should('include', PATHS.AUTHENTICATION)
	})

	it('redirects a logged-in user from the authentication page to the travellers list', () => {
		performLogin()
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)

		cy.location('pathname').should('eq', PATHS.TRAVELLERS)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'not.exist',
		)
	})

	it('sends a logged-in user to the redirect target on the authentication page', () => {
		performLogin()
		cy.visit(
			`${BASE_URL_CYPRESS}${PATHS.AUTHENTICATION}?redirect=${PATHS.REGISTER}`,
		)

		cy.location('pathname').should('eq', PATHS.REGISTER)
	})
})

describe('Staying signed in', () => {
	const STALE_TOKEN = 'stale-id-token'
	const AUTH_EMULATOR = new URL(Cypress.expose('API_URL')).origin
	const PROJECT = Cypress.expose('FIREBASE_PROJECT_ID')

	// What the SDK saved an hour or more after sign-in: an ID token past its lifetime, with the refresh token still good
	const expireSavedToken = (win) => {
		const key = Object.keys(win.localStorage).find((name) =>
			name.startsWith('firebase:authUser:'),
		)
		const user = JSON.parse(win.localStorage.getItem(key))
		user.stsTokenManager.accessToken = STALE_TOKEN
		user.stsTokenManager.expirationTime = Date.now() - 1000
		win.localStorage.setItem(key, JSON.stringify(user))
	}

	// The emulator's admin API, as the Firebase console would change the account
	const updateAccount = (body) =>
		cy.request({
			method: 'POST',
			url: `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
			headers: { Authorization: 'Bearer owner' },
			body,
		})

	it('keeps the traveller signed in past the ID token lifetime, renewing it for each request', () => {
		performLogin()
		cy.intercept('GET', '**/travellers.json*').as('travellers')

		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS, {
			onBeforeLoad: expireSavedToken,
		})

		cy.wait('@travellers', { timeout: REQUEST_TIMEOUT }).then(
			({ request, response }) => {
				const auth = new URL(request.url).searchParams.get('auth')
				expect(auth).to.be.a('string').and.not.equal(STALE_TOKEN)
				expect(response.statusCode).to.equal(200)
			},
		)
		cy.location('pathname').should('eq', PATHS.TRAVELLERS)
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('be.visible')
	})

	it('signs the traveller out, to the login page, once the account is disabled', () => {
		const email = `revoked-${Date.now()}@example.com`
		const password = 'revoked-password'
		cy.request(
			'POST',
			`${Cypress.expose('API_URL')}signUp?key=${Cypress.expose('API_KEY')}`,
			{ email, password, returnSecureToken: true },
		)
			.its('body.localId')
			.then((localId) => {
				updateAccount({ localId, emailVerified: true })

				cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
				cy.login(email, password)
				cy.window({ timeout: REQUEST_TIMEOUT }).should((win) => {
					expect(
						hasSdkSession({ ...win.localStorage }, email),
					).to.equal(true)
				})
				cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
					'not.eq',
					PATHS.AUTHENTICATION,
				)

				updateAccount({ localId, disableUser: true })
			})

		cy.visit(BASE_URL_CYPRESS + PATHS.MESSAGES)

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			PATHS.AUTHENTICATION,
		)
		cy.window().should((win) => {
			expect(hasSdkSession({ ...win.localStorage }, email)).to.equal(
				false,
			)
		})
	})
})
