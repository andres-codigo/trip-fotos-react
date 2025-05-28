import {
	apiDatabase,
	apiUrls,
	errorMessage,
	baseUrl,
	urls,
	user,
	dialog,
	dialogMessages,
	authenticationFormSelectors,
} from '../../support/constants'

describe('Login > User authentication page', () => {
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

	it('shows validation error for invalid password when Enter is pressed in the email field and password field is empty', () => {
		cy.get(authenticationFormSelectors.emailInput).type(
			user.validEmail + '{enter}',
		)

		cy.get(authenticationFormSelectors.passwordErrorMessage).should('exist')
	})

	it('submits the form when Enter is pressed in the password field', () => {
		cy.get(authenticationFormSelectors.emailInput).type(user.validEmail)
		cy.get(authenticationFormSelectors.passwordInput)
			.type(user.validPassword)
			.type('{enter}')

		cy.get(dialog.loading).should('exist')
	})

	it('switches between login and signup modes', () => {
		cy.get(authenticationFormSelectors.submitButtonSignup)
			.should('exist')
			.and(
				'contain.text',
				authenticationFormSelectors.submitButtonTextSignup,
			)
			.click()

		cy.get(authenticationFormSelectors.submitButtonSignup).should(
			'contain.text',
			authenticationFormSelectors.submitButtonTextLogin,
		)

		cy.get(authenticationFormSelectors.submitButtonLogin).should(
			'contain.text',
			authenticationFormSelectors.submitButtonTextSignup,
		)

		cy.get(authenticationFormSelectors.submitButtonSignup).click()

		cy.get(authenticationFormSelectors.submitButtonSignup).should(
			'contain.text',
			authenticationFormSelectors.submitButtonTextSignup,
		)

		cy.get(authenticationFormSelectors.submitButtonLogin).should(
			'contain.text',
			authenticationFormSelectors.submitButtonTextLogin,
		)
	})

	it('shows a loading dialog with spinner while authenticating', () => {
		cy.interceptLogin(apiDatabase.POST, apiUrls.signInWithPassword)
		cy.login(user.validEmail, user.validPassword)

		cy.get(dialog.loading)
			.parent()
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
					.and('match', /^data:image\/svg\+xml/)
			})

		cy.wait('@loginRequest')
	})

	it('redirects on successful login', () => {
		cy.interceptLogin(apiDatabase.POST, apiUrls.signInWithPassword)
		cy.login(user.validEmail, user.validPassword)
		cy.wait('@loginRequest')

		cy.url().should('include', urls.cyTrips)
	})
})

describe("Login error Dialog's > User authentication page", () => {
	const loginUrl = baseUrl + urls.cyAuth

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
					errorMessage[messageKey],
				)
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

	it.only('closes the error dialog when Escape is pressed', () => {
		// Trigger an error dialog (e.g., invalid credentials)
		cy.interceptLoginError(
			apiDatabase.POST,
			apiUrls.signInWithPassword,
			'INVALID_LOGIN_CREDENTIALS',
		)
		cy.login(user.validEmail, user.invalidPassword)
		cy.wait('@loginErrorRequest')

		// Ensure dialog is visible
		cy.get(dialog.invalidEmailOrPassword).should('exist')

		// Press Escape
		cy.get('body').type('{esc}')

		// Dialog should be closed
		cy.get(dialog.invalidEmailOrPassword).should('not.exist')
	})
})
