import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import { AUTH_FORM_CONFIG } from '@/constants/auth'
import { MOCK_KEYS, TEST_IDS } from '@/constants/test'

import UserAuthenticationForm from '@/components/forms/user-authentication/UserAuthenticationForm'

const IDS = TEST_IDS.USER_AUTH_FORM
const VALID = (value) => ({ value, isValid: true, message: '' })

const renderForm = (props = {}) => {
	const handlers = {
		onEmailChange: vi.fn(),
		onPasswordChange: vi.fn(),
		onEmailBlur: vi.fn(),
		onPasswordBlur: vi.fn(),
		onForgotPassword: vi.fn(),
		onSubmit: vi.fn((e) => e.preventDefault()),
		onSwitchMode: vi.fn(),
	}
	render(
		<BrowserRouter>
			<UserAuthenticationForm
				email={VALID(MOCK_KEYS.EMAIL)}
				password={VALID(MOCK_KEYS.PASSWORD)}
				mode={API_DATABASE.AUTH_LOGIN_MODE}
				{...handlers}
				{...props}
			/>
		</BrowserRouter>,
	)
	return handlers
}

describe('<UserAuthenticationForm />', () => {
	const field = (name) =>
		screen.getByLabelText(new RegExp(`^${name}`), { selector: 'input' })

	it.each([
		[
			API_DATABASE.AUTH_LOGIN_MODE,
			'Log in',
			'Log in',
			'New here? Create an account',
			'current-password',
		],
		[
			API_DATABASE.AUTH_SIGNUP_MODE,
			'Create an account',
			'Create account',
			'Already have an account? Log in',
			'new-password',
		],
	])(
		'renders the %s form, titled, with labelled required inputs',
		(mode, title, submit, toggle, passwordAutocomplete) => {
			renderForm({ mode })

			const form = screen.getByTestId(IDS.FORM)
			expect(form).toHaveAttribute('novalidate')
			expect(form).toHaveAttribute('aria-busy', 'false')
			expect(form).toHaveAccessibleName(title)
			expect(screen.getByText(/required/)).toBeInTheDocument()
			;['Email', 'Password'].forEach((label) => {
				const input = field(label)
				expect(input).toBeRequired()
				expect(input).toHaveAttribute('aria-required', 'true')
			})
			expect(field('Email')).toHaveAttribute('autocomplete', 'email')
			expect(field('Password')).toHaveAttribute(
				'autocomplete',
				passwordAutocomplete,
			)
			expect(
				screen.getByTestId(IDS.LOGIN_SUBMIT_BUTTON),
			).toHaveTextContent(submit)
			expect(screen.getByTestId('login-signup-toggle')).toHaveTextContent(
				toggle,
			)
		},
	)

	it('gives the password rule up front only when creating an account', () => {
		renderForm({ mode: API_DATABASE.AUTH_SIGNUP_MODE })

		expect(field('Password')).toHaveAccessibleDescription(
			AUTH_FORM_CONFIG.PASSWORD_HELP,
		)
		expect(
			screen.queryByRole('button', {
				name: AUTH_FORM_CONFIG.FORGOT_PASSWORD,
			}),
		).not.toBeInTheDocument()
	})

	it('offers Forgot password? on Log in, with no password rule', () => {
		const { onForgotPassword, onSubmit } = renderForm()

		expect(field('Password')).not.toHaveAttribute('aria-describedby')
		fireEvent.click(
			screen.getByRole('button', {
				name: AUTH_FORM_CONFIG.FORGOT_PASSWORD,
			}),
		)

		expect(onForgotPassword).toHaveBeenCalledTimes(1)
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('reports a field being left', () => {
		const { onEmailBlur, onPasswordBlur } = renderForm()

		fireEvent.blur(field('Email'))
		fireEvent.blur(field('Password'))

		expect(onEmailBlur).toHaveBeenCalledTimes(1)
		expect(onPasswordBlur).toHaveBeenCalledTimes(1)
	})

	it('reports input changes and submits', () => {
		const { onEmailChange, onPasswordChange, onSubmit } = renderForm()

		fireEvent.change(screen.getByTestId(IDS.EMAIL_INPUT), {
			target: { value: 'a@b.co' },
		})
		fireEvent.change(screen.getByTestId(IDS.PASSWORD_INPUT), {
			target: { value: 'secret' },
		})
		fireEvent.click(screen.getByTestId(IDS.LOGIN_SUBMIT_BUTTON))

		expect(onEmailChange).toHaveBeenCalled()
		expect(onPasswordChange).toHaveBeenCalled()
		expect(onSubmit).toHaveBeenCalledTimes(1)
	})

	it('switches mode from the toggle without submitting', () => {
		const { onSubmit, onSwitchMode } = renderForm()

		fireEvent.click(screen.getByTestId(IDS.LOGIN_SIGNUP_TOGGLE_LINK))

		expect(onSwitchMode).toHaveBeenCalledTimes(1)
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('disables the fields, keeps the busy button labelled and marks the form busy, while loading', () => {
		renderForm({ isLoading: true })

		expect(screen.getByTestId(IDS.EMAIL_INPUT)).toBeDisabled()
		expect(screen.getByTestId(IDS.PASSWORD_INPUT)).toBeDisabled()
		const submit = screen.getByTestId(IDS.LOGIN_SUBMIT_BUTTON)
		expect(submit).toBeDisabled()
		expect(submit).toHaveAttribute('aria-busy', 'true')
		expect(submit).toHaveTextContent(AUTH_FORM_CONFIG.LOGIN_BUSY)
		expect(screen.getByTestId(IDS.LOGIN_SIGNUP_TOGGLE_LINK)).toBeDisabled()
		expect(screen.getByTestId(IDS.FORM)).toHaveAttribute(
			'aria-busy',
			'true',
		)
	})

	it.each([
		['email', 'Email', 'Invalid email'],
		['password', 'Password', 'Invalid password'],
	])(
		'marks an invalid %s and links it to an alert with the message',
		(id, label, message) => {
			renderForm({ [id]: { value: '', isValid: false, message } })

			const input = field(label)
			expect(input).toHaveAttribute('aria-invalid', 'true')
			expect(input).toHaveAttribute('aria-describedby', `${id}-error`)
			const error = document.getElementById(`${id}-error`)
			expect(error).toHaveAttribute('role', 'alert')
			expect(error).toHaveTextContent(message)
		},
	)

	it('links no error to an invalid field that has no message', () => {
		renderForm({
			email: { value: '', isValid: false, message: '' },
			password: { value: '', isValid: false, message: '' },
		})

		expect(field('Email')).not.toHaveAttribute('aria-describedby')
		expect(field('Password')).not.toHaveAttribute('aria-describedby')
	})
})
