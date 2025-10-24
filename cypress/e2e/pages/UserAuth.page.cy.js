import { FIREBASE_ERRORS } from '../../../src/constants/auth'

import { DATABASE } from '../../support/constants/api/database'
import { dialog, dialogMessages } from '../../support/constants/dialog'
import { errorMessages } from '../../support/constants/errorMessages'
import { authenticationFormSelectors } from '../../support/constants/selectors/components'
import {
	BASE_URL,
	APP_URLS,
	SDK_METHOD_TYPE_URLS,
} from '../../support/constants/api/urls'
import { user } from '../../support/constants/users'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL + APP_URLS.CY_AUTHENTICATION

describe('Form rendering and validation', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('renders login form', () => {
		cy.get(authenticationFormSelectors.emailInput)
			.parent()
			.within(() => {
				cy.get('label[for="email"]').should(
					'contain.text',
					authenticationFormSelectors.emailLabel,
				)
				cy.get(authenticationFormSelectors.emailInput).should('exist')
			})

		cy.get(authenticationFormSelectors.passwordInput)
			.parent()
			.within(() => {
				cy.get('label[for="password"]').should(
					'contain.text',
					authenticationFormSelectors.passwordLabel,
				)
				cy.get(authenticationFormSelectors.passwordInput).should(
					'exist',
				)
			})

		cy.get(authenticationFormSelectors.loginSignupSubmitButton)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.submitButtonTextLogin,
			)

		cy.get(authenticationFormSelectors.loginSignupToggleLink)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.signupTextToggleLink,
			)
	})

	it('shows validation errors for empty fields', () => {
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
		cy.get(authenticationFormSelectors.emailErrorMessage).should('exist')
		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})

	it('shows validation error for invalid email', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.invalidEmail)
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
		cy.get(authenticationFormSelectors.emailErrorMessage).should('exist')
	})

	it('shows validation error for invalid password that is less than 6 characters long', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput).type(
			user.invalidPasswordTooShort,
		)

		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()
		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})

	it('shows validation error for invalid password when Enter is pressed in the email field and password field is empty', () => {
		cy.get(authenticationFormSelectors.emailInput).type(
			user.validEmail + '{enter}',
		)

		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})
})

describe('Form submission', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('submits the form when the Enter key is pressed in the password field', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput)
			.type(user.validPassword)
			.type('{enter}')

		cy.get(dialog.authenticating).should('exist')
	})

	it('trims leading/trailing spaces in the email and password fields before submitting', () => {
		cy.interceptLogin(
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		)

		const emailWithSpaces = `   ${user.validEmail}   `
		const passwordWithSpaces = `   ${user.validPassword}   `

		cy.login(emailWithSpaces, passwordWithSpaces)

		cy.wait('@loginRequest')
			.its('request.body')
			.should((body) => {
				expect(body.email).to.eq(user.validEmail)
				expect(body.password).to.eq(user.validPassword)
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
		cy.get(authenticationFormSelectors.loginSignupToggleLink)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.signupTextToggleLink,
			)
			.click()

		cy.get(authenticationFormSelectors.loginSignupToggleLink).should(
			'contain.text',
			authenticationFormSelectors.loginTextToggleLink,
		)

		cy.get(authenticationFormSelectors.loginSignupSubmitButton).should(
			'contain.text',
			authenticationFormSelectors.signupTextSubmitButton,
		)

		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click()

		cy.get(authenticationFormSelectors.loginSignupToggleLink).should(
			'contain.text',
			authenticationFormSelectors.loginTextToggleLink,
		)

		cy.get(authenticationFormSelectors.loginSignupSubmitButton).should(
			'contain.text',
			authenticationFormSelectors.signupTextSubmitButton,
		)
	})

	it('shows a loading dialog with spinner while authenticating', () => {
		cy.interceptLogin(
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
		)
		cy.login(user.validEmail, user.validPassword)

		cy.get(dialog.authenticating)
			.should('exist')
			.within(() => {
				cy.get(dialog.title).should(
					'contain.text',
					dialogMessages.loading.title,
				)
				cy.get(dialog.textContent).should(
					'contain.text',
					dialogMessages.loading.text,
				)
				cy.get(dialog.spinnerContainer).should('exist')
				cy.get(dialog.spinnerImage)
					.should('exist')
					.and('have.attr', 'src')
					.and('include', 'data:image/svg+xml')
			})

		cy.wait('@loginRequest')
	})

	it('disables form fields and buttons while the loading dialog displayed', () => {
		cy.interceptDelayedLogin(
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			1000,
		)
		cy.login(user.validEmail, user.validPassword)

		cy.get(authenticationFormSelectors.emailInput).should('be.disabled')
		cy.get(authenticationFormSelectors.passwordInput).should('be.disabled')
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).should(
			'be.disabled',
		)
		cy.get(authenticationFormSelectors.loginSignupToggleLink).should(
			'have.attr',
			'aria-disabled',
			'true',
		)

		// TODO: Investigate proper solution to not force: true on click
		// Use force: true because the backdrop is covered by content due to CSS positioning,
		// but clicking the backdrop is the intended functionality we need to test
		// eslint-disable-next-line cypress/no-force
		cy.get(authenticationFormSelectors.loginSignupSubmitButton).click({
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
		cy.get(dialog.invalidEmailOrPassword)
			.parent()
			.within(() => {
				cy.get(dialog.title).should(
					'contain.text',
					dialogMessages.error.title,
				)
				cy.get(dialog.textContent).should(
					'contain.text',
					errorMessages[messageKey],
				)
				cy.get('footer > button').should('contain.text', 'Close')
				cy.get('footer > button').click()
			})
	}

	function logInUsingIntercept(errorKey) {
		cy.interceptLoginError(
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			errorKey,
		)
		cy.login(user.validEmail, user.invalidPassword)
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
			DATABASE.POST,
			SDK_METHOD_TYPE_URLS.SIGN_IN_WITH_PASSWORD,
			FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
				.INVALID_LOGIN_CREDENTIALS,
		)
		cy.login(user.validEmail, user.invalidPassword)
		cy.wait('@loginErrorRequest')

		cy.get(dialog.invalidEmailOrPassword).should('exist')

		cy.get('body').type('{esc}')

		cy.get(dialog.invalidEmailOrPassword).should('not.exist')
	})
})
