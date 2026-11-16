import { API_DATABASE } from '../../../src/constants/api'
import { VERIFY_EMAIL_CONFIG } from '../../../src/constants/auth'
import {
	AUTHENTICATION_FORM_SELECTORS,
	REPLY_BOX_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	VERIFY_EMAIL_NOTE_SELECTORS,
	VERIFY_EMAIL_STRIP_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { TEST_USERS } from '../../../src/constants/config/users'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { conversationId } from '../../../src/utils/conversationId'

import { performLogin, sdkSessionOf } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const PROJECT = () => Cypress.expose('FIREBASE_PROJECT_ID')
const AUTH_EMULATOR = () => new URL(Cypress.expose('API_URL')).origin
const STORAGE_ORIGIN = 'http://127.0.0.1:9199'
const BUCKET = () => `${PROJECT()}.appspot.com`

const ME = () => TEST_USERS.TRAVELLER.ID
const OTHER = () => TEST_USERS.OTHER_TRAVELLER.ID

// The emulator's admin API, as an account made before verification was asked for would be
const markUnverified = (uid) =>
	cy.request({
		method: 'POST',
		url: `${AUTH_EMULATOR()}/identitytoolkit.googleapis.com/v1/projects/${PROJECT()}/accounts:update`,
		headers: { Authorization: 'Bearer owner' },
		body: { localId: uid, emailVerified: false },
	})

const signInUnverifiedTraveller = () => {
	cy.resetEmulators()
	markUnverified(ME())
	performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
}

const verifyByLink = (email) =>
	cy
		.request(
			`${AUTH_EMULATOR()}/emulator/v1/projects/${PROJECT()}/oobCodes`,
		)
		.then(({ body }) => {
			const { oobCode } = body.oobCodes.findLast(
				(code) =>
					code.email === email && code.requestType === 'VERIFY_EMAIL',
			)
			cy.request(
				API_DATABASE.POST,
				`${API_DATABASE.URL}update?key=${API_DATABASE.KEY}`,
				{ oobCode },
			)
		})

// The unverified traveller's saved session would otherwise serve a later spec that signs in as them without re-seeding
after(() => Cypress.session.clearAllSavedSessions())

// Talks to the emulators directly, as a script could, so a pass proves the rules and not just the notices
describe('Verified email rules', () => {
	const database = (method, path, token, body) =>
		cy.request({
			method,
			url: `${Cypress.expose('VITE_DATABASE_URL')}/${path}.json`,
			qs: { ns: Cypress.expose('VITE_DATABASE_NAMESPACE'), auth: token },
			body,
			failOnStatusCode: false,
		})
	const upload = (uid, token) =>
		cy.request({
			method: 'POST',
			url: `${STORAGE_ORIGIN}/v0/b/${BUCKET()}/o`,
			qs: { name: `images/${uid}/rules-test.png` },
			headers: {
				Authorization: `Firebase ${token}`,
				'Content-Type': 'image/png',
			},
			body: 'png',
			failOnStatusCode: false,
		})
	const signedIn = (callback) =>
		cy.window().then((win) => callback(sdkSessionOf(win)))
	const trip = {
		firstName: 'Rules',
		lastName: 'Test',
		tripDescription: 'Checking the verified email rules.',
		cities: ['tokyo'],
		files: ['https://example.com/photo.jpg'],
	}
	const PUSH_ID = '-ORulesTest000000002'
	const cid = () => conversationId(ME(), OTHER())

	describe('unverified', () => {
		beforeEach(signInUnverifiedTraveller)

		it('refuses a trip and its public summary', () => {
			signedIn(({ userId, token }) => {
				database(API_DATABASE.PUT, `travellers/${userId}`, token, trip)
					.its('status')
					.should('be.oneOf', [401, 403])
				database(API_DATABASE.PUT, `publicTrips/${userId}`, token, {
					firstName: 'Rules',
					cities: { tokyo: true },
				})
					.its('status')
					.should('be.oneOf', [401, 403])
			})
		})

		it('refuses a message', () => {
			signedIn(({ userId, token }) =>
				database(
					API_DATABASE.PATCH,
					`conversations/${cid()}/messages/${PUSH_ID}`,
					token,
					{
						senderId: userId,
						message: 'Hello from rules.',
						createdAt: API_DATABASE.SERVER_TIMESTAMP,
					},
				)
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})

		it('refuses a photo upload', () => {
			signedIn(({ userId, token }) =>
				upload(userId, token).its('status').should('eq', 403),
			)
		})

		it('still lets them delete their trip', () => {
			signedIn(({ userId, token }) => {
				database(API_DATABASE.DELETE, `travellers/${userId}`, token)
					.its('status')
					.should('eq', 200)
				database(API_DATABASE.DELETE, `publicTrips/${userId}`, token)
					.its('status')
					.should('eq', 200)
			})
		})
	})

	describe('verified', () => {
		beforeEach(() => {
			cy.resetEmulators()
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)
		})

		it('accepts the same message and upload', () => {
			signedIn(({ userId, token }) => {
				database(
					API_DATABASE.PATCH,
					`conversations/${cid()}/messages/${PUSH_ID}`,
					token,
					{
						senderId: userId,
						message: 'Hello from rules.',
						createdAt: API_DATABASE.SERVER_TIMESTAMP,
					},
				)
					.its('status')
					.should('eq', 200)
				upload(userId, token)
					.then(({ status, body }) => {
						expect(status).to.equal(200)
						return body.name
					})
					.then((name) =>
						cy.request({
							method: 'DELETE',
							url: `${STORAGE_ORIGIN}/v0/b/${BUCKET()}/o/${encodeURIComponent(name)}`,
							headers: { Authorization: `Firebase ${token}` },
						}),
					)
			})
		})
	})
})

describe('Unverified traveller', () => {
	beforeEach(signInUnverifiedTraveller)

	it('shows the verify strip on signed-in pages', () => {
		cy.visit(PATHS.TRAVELLERS)

		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT, { timeout: REQUEST_TIMEOUT })
			.should('be.visible')
			.and('contain', TEST_USERS.TRAVELLER.EMAIL)
		cy.checkA11y()
	})

	it('shows a note in place of the reply box', () => {
		cy.visit(`${PATHS.MESSAGES}/${conversationId(ME(), OTHER())}`)

		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.ROOT, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
		cy.get(REPLY_BOX_SELECTORS.ROOT).should('not.exist')
	})

	it('shows a note in place of the Edit trip form', () => {
		cy.visit(`${PATHS.TRAVELLERS}/${ME()}/edit`)

		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.ROOT, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('not.exist')
	})
})

describe('Register before and after verifying', () => {
	beforeEach(() => {
		cy.resetEmulators()
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	})

	it("shows the note instead of the form, then the form once I've verified", () => {
		const email = `register-${Date.now()}@example.com`
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(email)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.STANDARD.PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.get('h1', { timeout: REQUEST_TIMEOUT }).should(
			'have.text',
			VERIFY_EMAIL_CONFIG.TITLE,
		)

		cy.visit(PATHS.REGISTER)

		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.ROOT, {
			timeout: REQUEST_TIMEOUT,
		}).should('contain', email)
		cy.get(VERIFY_EMAIL_STRIP_SELECTORS.ROOT).should('not.exist')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('not.exist')
		cy.checkA11y()

		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.CHECK).click()
		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.MESSAGE).should('be.visible')

		verifyByLink(email)
		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.CHECK).click()

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
		cy.get(VERIFY_EMAIL_NOTE_SELECTORS.ROOT).should('not.exist')
	})
})
