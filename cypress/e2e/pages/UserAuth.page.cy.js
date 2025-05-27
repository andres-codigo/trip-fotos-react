import {
	apiDatabase,
	apiUrls,
	errorMessage,
	baseUrl,
	urls,
	user,
	authenticationFormSelectors,
} from '../../support/constants'

describe('User authentication page', () => {
	const loginUrl = baseUrl + urls.cyAuth

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

		cy.get(authenticationFormSelectors.submitButtonLogin)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.submitButtonTextLogin,
			)

		cy.get(authenticationFormSelectors.submitButtonSignup)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.submitButtonTextSignup,
			)
	})

	it('shows validation errors for empty fields', () => {
		cy.get(authenticationFormSelectors.submitButtonLogin).click()
		cy.get(authenticationFormSelectors.emailErrorMessage).should('exist')
		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})

	it('shows validation error for invalid email', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.invalidEmail)
		cy.get(authenticationFormSelectors.submitButtonLogin).click()
		cy.get(authenticationFormSelectors.emailErrorMessage).should('exist')
	})

	it('shows validation error for invalid password that is less than 6 characters long', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput).type(
			user.invalidPasswordTooShort,
		)

		cy.get(authenticationFormSelectors.submitButtonLogin).click()
		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})
})

describe('Log in error Dialogs > User authentication page', () => {
	const loginUrl = baseUrl + urls.cyAuth

	beforeEach(() => {
		cy.visit(loginUrl)
	})

	function assertErrorDialog(messageKey) {
		cy.get(authenticationFormSelectors.invalidEmailOrPasswordDialog)
			.parent()
			.within(() => {
				cy.get('h2').should('contain.text', 'An error occurred')
				cy.get('p').should('contain.text', errorMessage[messageKey])
				cy.get('footer > button').should('contain.text', 'Close')
				cy.get('footer > button').click()
			})
	}

	function logInUsingIntercept(errorKey) {
		cy.interceptLoginError(
			apiDatabase.POST,
			apiUrls.signInWithPassword,
			errorKey,
		)
		cy.login(user.validEmail, user.invalidPassword)
		cy.wait('@loginErrorRequest')

		assertErrorDialog(errorKey)
	}

	it('shows an invalid login credentials error dialog', () => {
		logInUsingIntercept('INVALID_LOGIN_CREDENTIALS')
	})

	it('shows too many unsuccessful login attempts error dialog', () => {
		logInUsingIntercept('TOO_MANY_ATTEMPTS_TRY_LATER')
	})

	it('shows the default error dialog', () => {
		logInUsingIntercept('DEFAULT')
	})
})
