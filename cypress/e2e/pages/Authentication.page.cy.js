import { API_DATABASE, SDK_METHOD_TYPE_URLS } from '../../../src/constants/api'
import { FIREBASE_ERRORS } from '../../../src/constants/auth'
import {
	AUTHENTICATION_FORM_SELECTORS,
	DIALOG_SELECTORS,
} from '../../../src/constants/test/selectors/components'

import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

import { TEST_USERS, AUTH_TEST_DATA } from '../../../src/constants/config/users'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

describe('Form rendering and validation', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('renders login form', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT)
			.parent()
			.within(() => {
				cy.get('label[for="email"]').should(
					'contain.text',
					AUTHENTICATION_FORM_SELECTORS.EMAIL_LABEL,
				)
				cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).should(
					'exist',
				)
			})

		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT)
			.parent()
			.within(() => {
				cy.get('label[for="password"]').should(
					'contain.text',
					AUTHENTICATION_FORM_SELECTORS.PASSWORD_LABEL,
				)
				cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).should(
					'exist',
				)
			})

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON)
			.should('exist')
			.and(
				'contain.text',
				AUTHENTICATION_FORM_SELECTORS.SUBMIT_BUTTON_TEXT_LOGIN,
			)

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK)
			.should('exist')
			.and(
				'contain.text',
				AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_TOGGLE_LINK,
			)
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

	it('shows validation error for invalid email', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			AUTH_TEST_DATA.INVALID_EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_ERROR_MESSAGE).should(
			'exist',
		)
	})

	it('shows validation error for invalid password that is less than 6 characters long', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			AUTH_TEST_DATA.INVALID_PASSWORD_TOO_SHORT,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_ERROR_MESSAGE).should(
			'exist',
		)
	})

	it('shows validation error for invalid password when Enter is pressed in the email field and password field is empty', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL + '{enter}',
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_ERROR_MESSAGE).should(
			'exist',
		)
	})
})

describe('Form submission', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('submits the form when the Enter key is pressed in the password field', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT)
			.type(TEST_USERS.STANDARD.PASSWORD)
			.type('{enter}')

		cy.get(DIALOG_SELECTORS.AUTHENTICATING).should('exist')
	})

	it('trims leading/trailing spaces in the email and password fields before submitting', () => {
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		)

		const emailWithSpaces = `   ${TEST_USERS.STANDARD.EMAIL}   `
		const passwordWithSpaces = `   ${TEST_USERS.STANDARD.PASSWORD}   `

		cy.login(emailWithSpaces, passwordWithSpaces)

		cy.wait('@loginRequest')
			.its('request.body')
			.should((body) => {
				expect(body.email).to.eq(TEST_USERS.STANDARD.EMAIL)
				expect(body.password).to.eq(TEST_USERS.STANDARD.PASSWORD)
			})
	})

	it('redirects on successful login', () => {
		performLogin()
	})
})

describe('UI state and mode switching', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('switches between login and signup modes', () => {
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK)
			.should('exist')
			.and(
				'contain.text',
				AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_TOGGLE_LINK,
			)
			.click()

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).should(
			'contain.text',
			AUTHENTICATION_FORM_SELECTORS.LOGIN_TEXT_TOGGLE_LINK,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'contain.text',
			AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_SUBMIT_BUTTON,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).should(
			'contain.text',
			AUTHENTICATION_FORM_SELECTORS.LOGIN_TEXT_TOGGLE_LINK,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'contain.text',
			AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_SUBMIT_BUTTON,
		)
	})

	it('shows a loading dialog with spinner while authenticating', () => {
		cy.interceptLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)

		cy.get(DIALOG_SELECTORS.AUTHENTICATING)
			.should('exist')
			.within(() => {
				cy.get(DIALOG_SELECTORS.TITLE).should(
					'contain.text',
					DIALOG_SELECTORS.MESSAGES.LOADING.TITLE,
				)
				cy.get(DIALOG_SELECTORS.TEXT_CONTENT).should(
					'contain.text',
					DIALOG_SELECTORS.MESSAGES.LOADING.TEXT,
				)
				cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('exist')
				cy.get(DIALOG_SELECTORS.SPINNER_IMAGE)
					.should('exist')
					.and('have.attr', 'src')
					.and('include', 'data:image/svg+xml')
			})

		cy.wait('@loginRequest')
	})

	it('disables form fields and buttons while the loading dialog displayed', () => {
		cy.interceptDelayedLogin(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			1000,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)

		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).should('be.disabled')
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).should(
			'be.disabled',
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).should(
			'be.disabled',
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK).should(
			'have.attr',
			'aria-disabled',
			'true',
		)

		// TODO: Investigate proper solution to not force: true on click
		// Use force: true because the backdrop is covered by content due to CSS positioning,
		// but clicking the backdrop is the intended functionality we need to test
		// eslint-disable-next-line cypress/no-force
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click({
			force: true,
		})
		cy.wait('@delayedLogin')
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
				cy.get('footer > button').should('contain.text', 'Close')
				cy.get('footer > button').click()
			})
	}

	function logInUsingIntercept(errorKey) {
		cy.interceptLoginError(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			errorKey,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)
		cy.wait('@loginErrorRequest')

		assertErrorDialog(errorKey)
	}

	it('shows an invalid login credentials error dialog', () => {
		logInUsingIntercept(
			FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.INVALID_LOGIN_CREDENTIALS,
		)
	})

	it('shows too many unsuccessful login attempts error dialog', () => {
		logInUsingIntercept(
			FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.TOO_MANY_ATTEMPTS_TRY_LATER,
		)
	})

	it('shows the default error dialog', () => {
		logInUsingIntercept(FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES.DEFAULT)
	})

	it('closes the error dialog when the Escape key is pressed', () => {
		cy.interceptLoginError(
			API_DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.INVALID_LOGIN_CREDENTIALS,
		)
		cy.login(TEST_USERS.STANDARD.EMAIL, TEST_USERS.STANDARD.PASSWORD)
		cy.wait('@loginErrorRequest')

		cy.get(DIALOG_SELECTORS.INVALID_EMAIL_OR_PASSWORD).should('exist')

		cy.get('body').type('{esc}')

		cy.get(DIALOG_SELECTORS.INVALID_EMAIL_OR_PASSWORD).should('not.exist')
	})
})
