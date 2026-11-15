import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AUTH_ACTION_CONFIG, AUTH_FORM_CONFIG } from '@/constants/auth'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import NewPasswordForm from '@/components/forms/new-password/NewPasswordForm'

const EMAIL = 'name@example.com'
const PASSWORD = 'secret-password'

const renderForm = (onSubmit = vi.fn(() => Promise.resolve(''))) => {
	render(
		<NewPasswordForm
			email={EMAIL}
			onSubmit={onSubmit}
		/>,
	)
	return { onSubmit }
}

const getPassword = () =>
	screen.getByLabelText(
		new RegExp(`^${AUTH_ACTION_CONFIG.NEW_PASSWORD_LABEL}`),
	)
const getSave = () =>
	screen.getByRole('button', { name: AUTH_ACTION_CONFIG.SAVE_PASSWORD })

describe('<NewPasswordForm />', () => {
	it('names the form after its heading, says whose password it is and focuses the field', () => {
		renderForm()
		expect(
			screen.getByRole('form', { name: AUTH_ACTION_CONFIG.RESET_TITLE }),
		).toBeInTheDocument()
		expect(
			screen.getByText(AUTH_ACTION_CONFIG.RESET_FOR(EMAIL)),
		).toBeInTheDocument()
		expect(getPassword()).toHaveFocus()
		expect(getPassword()).toHaveAttribute('type', 'password')
		expect(getPassword()).toHaveAttribute('autocomplete', 'new-password')
		expect(getPassword()).toHaveAccessibleDescription(
			AUTH_FORM_CONFIG.PASSWORD_HELP,
		)
	})

	it('shows the error, focuses the field and does not submit when the password is empty', () => {
		const { onSubmit } = renderForm()
		act(() => getSave().focus())
		fireEvent.click(getSave())
		expect(
			screen.getByText(VALIDATION_MESSAGES.PASSWORD_REQUIRED),
		).toBeInTheDocument()
		expect(getPassword()).toHaveAttribute('aria-invalid', 'true')
		expect(getPassword()).toHaveFocus()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('validates on blur but never raises a new error while typing', () => {
		renderForm()
		fireEvent.change(getPassword(), { target: { value: 'abc' } })
		expect(
			screen.queryByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
		).not.toBeInTheDocument()
		fireEvent.blur(getPassword())
		expect(
			screen.getByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
		).toBeInTheDocument()
		fireEvent.change(getPassword(), { target: { value: PASSWORD } })
		expect(
			screen.queryByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
		).not.toBeInTheDocument()
	})

	it('disables the field and shows Saving… while the save runs', async () => {
		let finish
		const { onSubmit } = renderForm(
			vi.fn(
				() =>
					new Promise((resolve) => {
						finish = resolve
					}),
			),
		)
		fireEvent.change(getPassword(), { target: { value: PASSWORD } })
		fireEvent.click(getSave())
		expect(onSubmit).toHaveBeenCalledWith(PASSWORD)
		expect(getPassword()).toBeDisabled()
		expect(
			screen.getByRole('button', { name: AUTH_ACTION_CONFIG.SAVING }),
		).toBeDisabled()
		finish('')
		await waitFor(() => expect(getPassword()).toBeEnabled())
		expect(getPassword()).toHaveAttribute('aria-invalid', 'false')
	})

	it('shows a message the save answers with as the field error and focuses the field', async () => {
		renderForm(
			vi.fn(() =>
				Promise.resolve(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
			),
		)
		fireEvent.change(getPassword(), { target: { value: PASSWORD } })
		act(() => getSave().focus())
		fireEvent.click(getSave())
		expect(
			await screen.findByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
		).toBeInTheDocument()
		expect(getPassword()).toHaveAttribute('aria-invalid', 'true')
		await waitFor(() => expect(getPassword()).toHaveFocus())
	})
})
