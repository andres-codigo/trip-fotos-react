import { BrowserRouter } from 'react-router-dom'

import UserAuthForm from '../UserAuthForm'

describe('<UserAuthForm />', () => {
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
			cy.get('[data-cy="user-authentication-form"]').should('exist')
		})
		it('renders email and password inputs', () => {
			render()
			cy.get('[data-cy="email-input"]').should('exist')
			cy.get('[data-cy="password-input"]').should('exist')
		})
		it('renders the submit button with correct text', () => {
			render()
			cy.get('[data-cy="login-submit-button"]').should(
				'contain',
				'Log in',
			)
		})
		it('renders the toggle link with correct text', () => {
			render()
			cy.get('[data-cy="login-signup-toggle-link"]').should(
				'contain',
				'Switch to Signup',
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
			cy.get('[data-cy="email-input"]').type('test@example.com')
			cy.get('@onEmailChange').should('have.been.called')
		})

		it('calls onPasswordChange at least once when password input changes', () => {
			render()
			cy.get('[data-cy="password-input"]').type('password123')
			cy.get('@onPasswordChange').should('have.been.called')
		})

		it('calls onSubmit when form is submitted', () => {
			render()
			cy.get('form').submit()
			cy.get('@onSubmit').should('have.been.called')
		})

		it('shows loading message and disables inputs/buttons when isLoading is true', () => {
			render({ isLoading: true })
			cy.get('[data-cy="email-input"]').should('be.disabled')
			cy.get('[data-cy="password-input"]').should('be.disabled')
			cy.get('[data-cy="login-submit-button"]').should('be.disabled')
			cy.get('[data-cy="login-signup-toggle-link"]').should(
				'have.attr',
				'aria-disabled',
				'true',
			)
		})

		it('shows error messages when email or password is invalid', () => {
			render({
				email: { value: '', isValid: false, message: 'Invalid email' },
				password: {
					value: '',
					isValid: false,
					message: 'Invalid password',
				},
			})
			cy.get('[data-cy-error="email-error-message"]').should(
				'contain',
				'Invalid email',
			)
			cy.get('[data-cy-error="password-error-message"]').should(
				'contain',
				'Invalid password',
			)
		})

		it('toggles button text based on mode', () => {
			render({ mode: 'login' })
			cy.get('[data-cy="login-submit-button"]').should(
				'contain',
				'Log in',
			)
			cy.get('[data-cy="login-signup-toggle-link"]').should(
				'contain',
				'Switch to Signup',
			)

			render({ mode: 'signup' })
			cy.get('[data-cy="login-submit-button"]').should(
				'contain',
				'Sign up',
			)
			cy.get('[data-cy="login-signup-toggle-link"]').should(
				'contain',
				'Switch to Login',
			)
		})

		it('calls onSwitchMode when toggle link is clicked', () => {
			render()
			cy.get('[data-cy="login-signup-toggle-link"]').click()
			cy.get('@onSwitchMode').should('have.been.called')
		})
	})

	describe('Accessibility tests', () => {
		it('associates form with heading via aria-labelledby', () => {
			render()
			cy.get('form')
				.should('have.attr', 'aria-labelledby')
				.then((labelledby) => {
					cy.get(`#${labelledby}`).should('exist')
				})
		})

		it('email input is associated with its label', () => {
			render()
			cy.get('label[for="email"]').should('exist')
			cy.get('#email').should('exist')
		})

		it('password input is associated with its label', () => {
			render()
			cy.get('label[for="password"]').should('exist')
			cy.get('#password').should('exist')
		})

		it('inputs have aria-required and required attributes', () => {
			render()
			cy.get('#email').should('have.attr', 'aria-required', 'true')
			cy.get('#email').should('have.attr', 'required')
			cy.get('#password').should('have.attr', 'aria-required', 'true')
			cy.get('#password').should('have.attr', 'required')
		})

		it('inputs have aria-invalid set to true when invalid', () => {
			render({
				email: { value: '', isValid: false, message: 'Invalid email' },
				password: {
					value: '',
					isValid: false,
					message: 'Invalid password',
				},
			})
			cy.get('#email').should('have.attr', 'aria-invalid', 'true')
			cy.get('#password').should('have.attr', 'aria-invalid', 'true')
		})

		it('inputs have aria-describedby referencing error message when invalid', () => {
			render({
				email: { value: '', isValid: false, message: 'Invalid email' },
				password: {
					value: '',
					isValid: false,
					message: 'Invalid password',
				},
			})
			cy.get('#email')
				.should('have.attr', 'aria-describedby')
				.and('eq', 'email-error')
			cy.get('#password')
				.should('have.attr', 'aria-describedby')
				.and('eq', 'password-error')
		})

		it('error messages have role="alert"', () => {
			render({
				email: { value: '', isValid: false, message: 'Invalid email' },
				password: {
					value: '',
					isValid: false,
					message: 'Invalid password',
				},
			})
			cy.get('#email-error').should('have.attr', 'role', 'alert')
			cy.get('#password-error').should('have.attr', 'role', 'alert')
		})

		it('form has aria-busy when loading', () => {
			render({ isLoading: true })
			cy.get('form').should('have.attr', 'aria-busy', 'true')
		})
	})
})
