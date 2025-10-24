import { BrowserRouter } from 'react-router-dom'

import { accessibilitySelectors } from '../../../../cypress/support/constants/accessibility'
import { AUTHENTICATION_FORM_SELECTORS } from '../../../../cypress/support/constants/selectors/components'

import UserAuthForm from '../UserAuthForm'

import userAuthStyles from '../UserAuthForm.module.scss'

describe('<UserAuthForm />', () => {
	const EMAIL_ID = 'email'
	const EMAIL_SELECTOR = `#${EMAIL_ID}`
	const EMAIL_LABEL_SELECTOR = `label[for="${EMAIL_ID}"]`
	const INVALID_EMAIL_MESSAGE = 'Invalid email'

	const PASSWORD_ID = 'password'
	const PASSWORD_SELECTOR = `#${PASSWORD_ID}`
	const PASSWORD_LABEL_SELECTOR = `label[for="${PASSWORD_ID}"]`
	const INVALID_PASSWORD_MESSAGE = 'Invalid password'

	const email = {
		value: '',
		isValid: true,
		message: '',
	}
	const password = {
		value: '',
		isValid: true,
		message: '',
	}

	let onEmailChange
	let onPasswordChange
	let onSubmit
	let onSwitchMode

	const render = (props = {}) => {
		cy.mount(
			<BrowserRouter>
				<UserAuthForm
					email={email}
					password={password}
					mode="login"
					onEmailChange={onEmailChange}
					onPasswordChange={onPasswordChange}
					onSubmit={onSubmit}
					onSwitchMode={onSwitchMode}
					{...props}
				/>
			</BrowserRouter>,
		)
	}

	beforeEach(() => {
		onEmailChange = cy.stub().as('onEmailChange')
		onPasswordChange = cy.stub().as('onPasswordChange')
		onSubmit = cy
			.stub()
			.callsFake((e) => e && e.preventDefault())
			.as('onSubmit')
		onSwitchMode = cy.stub().as('onSwitchMode')
	})

	describe('Rendering tests', () => {
		it('renders the form with correct data-cy attribute', () => {
			render()
			cy.get(AUTHENTICATION_FORM_SELECTORS.AUTHENTICATION_FORM).should(
				'exist',
			)
		})
		it('renders form title', () => {
			render()
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.USER_AUTHENTICATION_TITLE,
			).should('exist')
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.USER_AUTHENTICATION_TITLE,
			).should('have.class', userAuthStyles.userAuthenticationTitle)
		})
		it('renders email and password inputs', () => {
			render()
			cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).should('exist')
			cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).should('exist')
		})
		it('renders the submit button with correct text', () => {
			render()
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.SUBMIT_BUTTON_TEXT_LOGIN,
			)
		})
		it('renders the toggle link with correct text', () => {
			render()
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_TOGGLE_LINK,
			)
		})
		it('renders the form controls with correct class', () => {
			render()
			cy.get('.formControlInput').should('have.length', 2)
			cy.get('.formControlInput').each(($el) => {
				cy.wrap($el).should('have.class', 'formControlInput')
			})
		})
	})

	describe('Behaviour tests', () => {
		it('calls onEmailChange at least once when email input changes', () => {
			render()
			cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
				'test@example.com',
			)
			cy.get('@onEmailChange').should('have.been.called')
		})

		it('calls onPasswordChange at least once when password input changes', () => {
			render()
			cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
				'password123',
			)
			cy.get('@onPasswordChange').should('have.been.called')
		})

		it('calls onSubmit when form is submitted', () => {
			render()
			cy.get('form').submit()
			cy.get('@onSubmit').should('have.been.called')
		})

		it('shows loading message and disables inputs/buttons when isLoading is true', () => {
			render({ isLoading: true })
			cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).should(
				'be.disabled',
			)
			cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).should(
				'be.disabled',
			)
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON,
			).should('be.disabled')
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK,
			).should('have.attr', 'aria-disabled', 'true')
		})

		it('shows error messages when email or password is invalid', () => {
			render({
				email: {
					value: '',
					isValid: false,
					message: INVALID_EMAIL_MESSAGE,
				},
				password: {
					value: '',
					isValid: false,
					message: INVALID_PASSWORD_MESSAGE,
				},
			})
			cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_ERROR_MESSAGE).should(
				'contain',
				INVALID_EMAIL_MESSAGE,
			)
			cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_ERROR_MESSAGE).should(
				'contain',
				INVALID_PASSWORD_MESSAGE,
			)
		})

		it('toggles button text based on mode', () => {
			render({ mode: 'login' })
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.SUBMIT_BUTTON_TEXT_LOGIN,
			)
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_TOGGLE_LINK,
			)

			render({ mode: 'signup' })
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.SIGNUP_TEXT_SUBMIT_BUTTON,
			)
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK,
			).should(
				'contain',
				AUTHENTICATION_FORM_SELECTORS.LOGIN_TEXT_TOGGLE_LINK,
			)
		})

		it('calls onSwitchMode when toggle link is clicked', () => {
			render()
			cy.get(
				AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_TOGGLE_LINK,
			).click()
			cy.get('@onSwitchMode').should('have.been.called')
		})
	})

	describe('Accessibility tests', () => {
		it('associates form with heading via aria-labelledby', () => {
			render()
			cy.get('form')
				.should('have.attr', accessibilitySelectors.ARIA_LABELLEDBY)
				.then((labelledby) => {
					cy.get(`#${labelledby}`).should('exist')
				})
		})

		it('email input is associated with its label', () => {
			render()
			cy.get(EMAIL_LABEL_SELECTOR).should('exist')
			cy.get(EMAIL_SELECTOR).should('exist')
		})

		it('password input is associated with its label', () => {
			render()
			cy.get(PASSWORD_LABEL_SELECTOR).should('exist')
			cy.get(PASSWORD_SELECTOR).should('exist')
		})

		it('inputs have aria-required and required attributes', () => {
			render()
			cy.get(EMAIL_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.ARIA_REQUIRED,
				'true',
			)
			cy.get(EMAIL_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.REQUIRED,
			)
			cy.get(PASSWORD_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.ARIA_REQUIRED,
				'true',
			)
			cy.get(PASSWORD_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.REQUIRED,
			)
		})

		it('inputs have aria-invalid set to true when invalid', () => {
			render({
				email: {
					value: '',
					isValid: false,
					message: INVALID_EMAIL_MESSAGE,
				},
				password: {
					value: '',
					isValid: false,
					message: INVALID_PASSWORD_MESSAGE,
				},
			})
			cy.get(EMAIL_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.ARIA_INVALID,
				'true',
			)
			cy.get(PASSWORD_SELECTOR).should(
				'have.attr',
				accessibilitySelectors.ARIA_INVALID,
				'true',
			)
		})

		it('inputs have aria-describedby referencing error message when invalid', () => {
			render({
				email: {
					value: '',
					isValid: false,
					message: INVALID_EMAIL_MESSAGE,
				},
				password: {
					value: '',
					isValid: false,
					message: INVALID_PASSWORD_MESSAGE,
				},
			})
			cy.get(EMAIL_SELECTOR)
				.should('have.attr', accessibilitySelectors.ARIA_DESCRIBEDBY)
				.and('eq', 'email-error')
			cy.get(PASSWORD_SELECTOR)
				.should('have.attr', accessibilitySelectors.ARIA_DESCRIBEDBY)
				.and('eq', 'password-error')
		})

		it('error messages have role="alert"', () => {
			render({
				email: {
					value: '',
					isValid: false,
					message: INVALID_EMAIL_MESSAGE,
				},
				password: {
					value: '',
					isValid: false,
					message: INVALID_PASSWORD_MESSAGE,
				},
			})
			cy.get('#email-error').should(
				'have.attr',
				accessibilitySelectors.ROLE,
				accessibilitySelectors.ALERT,
			)
			cy.get('#password-error').should(
				'have.attr',
				accessibilitySelectors.ROLE,
				accessibilitySelectors.ALERT,
			)
		})

		it('form has aria-busy when loading', () => {
			render({ isLoading: true })
			cy.get('form').should(
				'have.attr',
				accessibilitySelectors.ARIA_BUSY,
				'true',
			)
		})
	})
})
