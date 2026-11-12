import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import { API_DATABASE } from '@/constants/api'
import { MOCK_KEYS, TEST_IDS } from '@/constants/test'

import UserAuthenticationForm from '@/components/forms/user-authentication/UserAuthenticationForm'

const IDS = TEST_IDS.USER_AUTH_FORM
const VALID = (value) => ({ value, isValid: true, message: '' })

const renderForm = (props = {}) => {
	const handlers = {
		onEmailChange: vi.fn(),
		onPasswordChange: vi.fn(),
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
	it.each([
		[API_DATABASE.AUTH_LOGIN_MODE, 'Login', 'Log in', 'Switch to Signup'],
		[API_DATABASE.AUTH_SIGNUP_MODE, 'Signup', 'Sign up', 'Switch to Login'],
	])(
		'renders the %s form, titled, with labelled required inputs',
		(mode, title, submit, toggle) => {
			renderForm({ mode })

			const form = screen.getByTestId(IDS.FORM)
			expect(form).toHaveAttribute('novalidate')
			expect(form).toHaveAttribute('aria-busy', 'false')
			expect(form).toHaveAccessibleName(`${title} Form`)
			;[/E-Mail/, /Password/].forEach((label) => {
				const input = screen.getByLabelText(label)
				expect(input).toBeRequired()
				expect(input).toHaveAttribute('aria-required', 'true')
				expect(input).not.toHaveAttribute('aria-describedby')
			})
			expect(
				screen.getByTestId(IDS.LOGIN_SUBMIT_BUTTON),
			).toHaveTextContent(submit)
			expect(
				screen.getByTestId(IDS.LOGIN_SIGNUP_TOGGLE_LINK),
			).toHaveTextContent(toggle)
		},
	)

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

	it('disables the inputs and both buttons, and marks the form busy, while loading', () => {
		renderForm({ isLoading: true })

		expect(screen.getByTestId(IDS.EMAIL_INPUT)).toBeDisabled()
		expect(screen.getByTestId(IDS.PASSWORD_INPUT)).toBeDisabled()
		expect(screen.getByTestId(IDS.LOGIN_SUBMIT_BUTTON)).toBeDisabled()
		expect(
			screen.getByTestId(IDS.LOGIN_SIGNUP_TOGGLE_LINK),
		).toHaveAttribute('aria-disabled', 'true')
		expect(screen.getByTestId(IDS.FORM)).toHaveAttribute(
			'aria-busy',
			'true',
		)
	})

	it.each([
		['email', /E-Mail/, 'Invalid email'],
		['password', /Password/, 'Invalid password'],
	])(
		'marks an invalid %s and links it to an alert with the message',
		(field, label, message) => {
			renderForm({ [field]: { value: '', isValid: false, message } })

			const input = screen.getByLabelText(label)
			expect(input).toHaveAttribute('aria-invalid', 'true')
			expect(input).toHaveAttribute('aria-describedby', `${field}-error`)
			const error = document.getElementById(`${field}-error`)
			expect(error).toHaveAttribute('role', 'alert')
			expect(error).toHaveTextContent(message)
		},
	)

	it('links no error to an invalid field that has no message', () => {
		renderForm({
			email: { value: '', isValid: false, message: '' },
			password: { value: '', isValid: false, message: '' },
		})

		expect(screen.getByLabelText(/E-Mail/)).not.toHaveAttribute(
			'aria-describedby',
		)
		expect(screen.getByLabelText(/Password/)).not.toHaveAttribute(
			'aria-describedby',
		)
	})
})
