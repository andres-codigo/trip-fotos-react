import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import {
	AUTH_ACTION_CONFIG,
	AUTH_ACTION_MODES,
	AUTH_FORM_CONFIG,
	PASSWORD_RESET_CONFIG,
	VERIFY_EMAIL_CONFIG,
} from '../../../src/constants/auth'
import { IDENTITY_TOOLKIT_ERRORS } from '../../../src/constants/test/mock-data/mock-api'
import {
	ACCOUNT_MENU_SELECTORS,
	AUTHENTICATION_FORM_SELECTORS,
	DIALOG_SELECTORS,
	PASSWORD_RESET_FORM_SELECTORS,
	VERIFY_EMAIL_INBOX_SELECTORS,
} from '../../../src/constants/test/selectors/components'

import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

import { TEST_USERS } from '../../../src/constants/config/users'

import { hasSdkSession, performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION
const REQUEST_TIMEOUT = 10000

describe('Form rendering and validation', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('shows validation errors for empty fields', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_ERROR_MESSAGE).should(
			'exist',
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_ERROR_MESSAGE).should(
			'exist',
		)
	})
})

describe('Accessibility', () => {
	it('has no axe violations on the authentication page', () => {
		cy.visit(loginUrl)
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).should('be.visible')

		cy.checkA11y()
	})
})

describe('Form submission', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('submits the form when the Enter key is pressed in the password field', () => {
		cy.interceptDelayedLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			1000,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT)
			.type(TEST_USERS.STANDARD.PASSWORD)
			.type('{enter}')

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON)
			.should('have.attr', 'aria-busy', 'true')
			.and('contain.text', AUTH_FORM_CONFIG.LOGIN_BUSY)
		cy.wait('@delayedLogin', { timeout: REQUEST_TIMEOUT })
	})

	it('redirects on successful login', () => {
		performLogin()
	})
})

describe('UI error dialog', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	function assertErrorDialog(messageKey) {
		cy.get(DIALOG_SELECTORS.INVALID_EMAIL_OR_PASSWORD)
			.parent()
			.within(() => {
				cy.get(DIALOG_SELECTORS.TITLE).should(
					'contain.text',
					DIALOG_SELECTORS.MESSAGES.ERROR.TITLE,
				)
				cy.get(DIALOG_SELECTORS.TEXT_CONTENT).should(
					'contain.text',
					DIALOG_SELECTORS.MESSAGES.AUTHENTICATION_ERRORS[messageKey],
				)
				cy.get(DIALOG_SELECTORS.CLOSE_BUTTON).should(
					'contain.text',
					'Close',
				)
				cy.get(DIALOG_SELECTORS.CLOSE_BUTTON).click()
			})
	}

	function logInUsingIntercept(errorKey) {
		cy.interceptLoginError(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			errorKey,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)
		cy.wait('@loginErrorRequest', { timeout: REQUEST_TIMEOUT })

		assertErrorDialog(errorKey)
	}

	it('shows an invalid login credentials error dialog', () => {
		logInUsingIntercept(IDENTITY_TOOLKIT_ERRORS.INVALID_LOGIN_CREDENTIALS)
	})

	it('closes the error dialog when the Escape key is pressed', () => {
		cy.interceptLoginError(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			IDENTITY_TOOLKIT_ERRORS.INVALID_LOGIN_CREDENTIALS,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)
		cy.wait('@loginErrorRequest', { timeout: REQUEST_TIMEOUT })

		cy.get(DIALOG_SELECTORS.INVALID_EMAIL_OR_PASSWORD).should('exist')

		cy.get('body').type('{esc}')

		cy.get(DIALOG_SELECTORS.INVALID_EMAIL_OR_PASSWORD).should('not.exist')
	})
})

describe('Sign-up journey', () => {
	beforeEach(() => {
		cy.resetEmulators()
		cy.visit(loginUrl)
	})

	const signUp = (email) => {
		cy.interceptLogin(
			API_DATABASE.POST,
			`${API_DATABASE.URL}signUp?key=${API_DATABASE.KEY}`,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(email)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.STANDARD.PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })
		cy.get('h1', { timeout: REQUEST_TIMEOUT }).should(
			'have.text',
			VERIFY_EMAIL_CONFIG.TITLE,
		)
	}

	// Firebase's default email page verifies the address in another tab, as production does until the custom action URL is set
	const verifyElsewhere = (email) =>
		cy
			.request(
				`${new URL(API_DATABASE.URL).origin}/emulator/v1/projects/${Cypress.expose('FIREBASE_PROJECT_ID')}/oobCodes`,
			)
			.then(({ body }) => {
				const { oobCode } = body.oobCodes.find(
					(code) =>
						code.email === email &&
						code.requestType === 'VERIFY_EMAIL',
				)
				cy.request(
					API_DATABASE.POST,
					`${API_DATABASE.URL}update?key=${API_DATABASE.KEY}`,
					{ oobCode },
				)
			})

	const shouldBeSignedInOnRegister = () => {
		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			PATHS.REGISTER,
		)
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
	}

	it("continues to Register signed in when I've verified finds the address verified", () => {
		const email = `checked-${Date.now()}@example.com`
		signUp(email)
		verifyElsewhere(email)

		cy.contains('button', VERIFY_EMAIL_CONFIG.CHECK).click()

		shouldBeSignedInOnRegister()
	})

	it('keeps Check your inbox after a reload, then continues to Register once verified', () => {
		const email = `reloaded-${Date.now()}@example.com`
		signUp(email)
		// The Auth SDK makes a follow-up call before the session is stored, so a reload any sooner logs the user out
		cy.window({ timeout: REQUEST_TIMEOUT }).should((win) => {
			expect(hasSdkSession({ ...win.localStorage }, email)).to.equal(true)
		})

		cy.reload()

		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
		cy.get('h1', { timeout: REQUEST_TIMEOUT }).should(
			'have.text',
			VERIFY_EMAIL_CONFIG.TITLE,
		)
		cy.get(VERIFY_EMAIL_INBOX_SELECTORS.STATUS).should('contain', email)
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('not.exist')

		verifyElsewhere(email)
		cy.contains('button', VERIFY_EMAIL_CONFIG.CHECK).click()

		shouldBeSignedInOnRegister()
	})

	it("lands signed in on Register from the default email page's Continue button", () => {
		const email = `continued-${Date.now()}@example.com`
		signUp(email)
		verifyElsewhere(email)

		cy.visit(BASE_URL_CYPRESS + PATHS.REGISTER)

		shouldBeSignedInOnRegister()
	})

	it('signs a new user up, verifies the email from its link and continues to Register', () => {
		const email = `new-user-${Date.now()}@example.com`
		cy.interceptLogin(
			API_DATABASE.POST,
			`${API_DATABASE.URL}signUp?key=${API_DATABASE.KEY}`,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(email)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.STANDARD.PASSWORD,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.wait('@loginRequest', { timeout: REQUEST_TIMEOUT })

		cy.get('h1', { timeout: REQUEST_TIMEOUT })
			.should('have.text', VERIFY_EMAIL_CONFIG.TITLE)
			.and('have.focus')
		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)

		// The auth emulator keeps every email link it would have sent
		cy.request(
			`${new URL(API_DATABASE.URL).origin}/emulator/v1/projects/${Cypress.expose('FIREBASE_PROJECT_ID')}/oobCodes`,
		).then(({ body }) => {
			const { oobCode, oobLink } = body.oobCodes.find(
				(code) =>
					code.email === email && code.requestType === 'VERIFY_EMAIL',
			)
			// Firebase's default email page offers this as a Continue button back to the app
			cy.location('origin').then((origin) => {
				expect(
					new URL(oobLink).searchParams.get('continueUrl'),
				).to.equal(`${origin}${PATHS.REGISTER}`)
			})
			cy.visit(
				`${PATHS.AUTH_ACTION}?mode=${AUTH_ACTION_MODES.VERIFY_EMAIL}&oobCode=${oobCode}`,
			)
		})

		cy.get('h1', { timeout: REQUEST_TIMEOUT }).should(
			'have.text',
			AUTH_ACTION_CONFIG.VERIFIED_TITLE,
		)
		cy.contains('a, button', AUTH_ACTION_CONFIG.REGISTER).click()
		cy.location('pathname').should('eq', PATHS.REGISTER)
	})
})

describe('Forgot password', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('sends a reset link from the Login card and says to check email', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.FORGOT_PASSWORD_LINK).click()

		cy.get(PASSWORD_RESET_FORM_SELECTORS.TITLE).should('have.focus')
		cy.get(PASSWORD_RESET_FORM_SELECTORS.EMAIL_INPUT).should(
			'have.value',
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.checkA11y()

		cy.get(PASSWORD_RESET_FORM_SELECTORS.SUBMIT).click()

		cy.get(PASSWORD_RESET_FORM_SELECTORS.SENT_MESSAGE, {
			timeout: REQUEST_TIMEOUT,
		}).should(
			'contain.text',
			PASSWORD_RESET_CONFIG.SENT_MESSAGE(TEST_USERS.STANDARD.EMAIL),
		)

		cy.get(PASSWORD_RESET_FORM_SELECTORS.BACK).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'contain.text',
			AUTH_FORM_CONFIG.LOGIN_SUBMIT,
		)
	})
})
