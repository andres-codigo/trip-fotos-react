import { BrowserRouter } from 'react-router-dom'

import { AUTHENTICATION_FORM_SELECTORS as SELECTORS } from '@/constants/test'

import UserAuthenticationForm from '@/components/forms/user-authentication/UserAuthenticationForm'

describe('<UserAuthenticationForm />', () => {
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
				<UserAuthenticationForm
					email={email}
					password={password}
					mode="login"
					onEmailChange={onEmailChange}
					onPasswordChange={onPasswordChange}
					onSubmit={onSubmit}
					onSwitchMode={onSwitchMode}
					onEmailBlur={cy.stub()}
					onPasswordBlur={cy.stub()}
					onForgotPassword={cy.stub()}
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

	it('has no axe violations in login and signup modes', () => {
		render()
		cy.checkA11y()

		render({ mode: 'signup' })
		cy.checkA11y()
	})

	it('has no axe violations with both fields invalid and while logging in', () => {
		render({
			email: { value: 'a@', isValid: false, message: 'Enter an email.' },
			password: {
				value: '',
				isValid: false,
				message: 'Enter a password.',
			},
		})
		cy.checkA11y()

		render({ isLoading: true })
		cy.checkA11y()
	})

	it('keeps the Show button inside the password field and 44px links', () => {
		render()
		cy.get(SELECTORS.PASSWORD_INPUT).then(($input) => {
			const field = $input[0].getBoundingClientRect()
			cy.get(SELECTORS.PASSWORD_TOGGLE).then(($button) => {
				const button = $button[0].getBoundingClientRect()
				expect(button.right).to.be.at.most(field.right)
				expect(button.top).to.be.at.least(field.top)
				expect(button.bottom).to.be.at.most(field.bottom)
			})
		})
		cy.get(SELECTORS.FORGOT_PASSWORD_LINK)
			.invoke('outerHeight')
			.should('be.gte', 44)
	})
})
