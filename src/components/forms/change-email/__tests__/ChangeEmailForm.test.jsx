import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CHANGE_EMAIL_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import ChangeEmailForm from '@/components/forms/change-email/ChangeEmailForm'

const CURRENT_EMAIL = 'ana@example.com'

const renderForm = ({
	onSubmit = vi.fn(() => Promise.resolve('')),
	onCancel = vi.fn(),
	...props
} = {}) => {
	render(
		<ChangeEmailForm
			currentEmail={CURRENT_EMAIL}
			onSubmit={onSubmit}
			onCancel={onCancel}
			{...props}
		/>,
	)
	return { onSubmit, onCancel }
}

const getField = (label) => screen.getByLabelText(new RegExp(`^${label}`))
const newEmailField = () => getField(CHANGE_EMAIL_CONFIG.NEW_EMAIL_LABEL)
const currentField = () => getField(CHANGE_EMAIL_CONFIG.CURRENT_PASSWORD_LABEL)

const fill = (email, password) => {
	fireEvent.change(newEmailField(), { target: { value: email } })
	fireEvent.change(currentField(), { target: { value: password } })
}

const send = () =>
	fireEvent.click(
		screen.getByRole('button', { name: CHANGE_EMAIL_CONFIG.SEND_LINK }),
	)

describe('<ChangeEmailForm />', () => {
	it('names the form after its heading and shows the intro', () => {
		renderForm()
		expect(
			screen.getByRole('form', { name: CHANGE_EMAIL_CONFIG.TITLE }),
		).toBeInTheDocument()
		expect(screen.getByText(CHANGE_EMAIL_CONFIG.INTRO)).toBeInTheDocument()
		expect(newEmailField()).toHaveAttribute('type', 'email')
		expect(currentField()).toHaveAttribute('type', 'password')
	})

	it('starts with focus in New email', async () => {
		renderForm()
		await waitFor(() => expect(newEmailField()).toHaveFocus())
	})

	it('submits the trimmed new email and the current password', async () => {
		const { onSubmit } = renderForm()
		fill('  new@example.com  ', 'secret-password')
		send()
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				newEmail: 'new@example.com',
				currentPassword: 'secret-password',
			}),
		)
	})

	it('calls onCancel from the Cancel button', () => {
		const { onCancel, onSubmit } = renderForm()
		fireEvent.click(
			screen.getByRole('button', { name: CHANGE_EMAIL_CONFIG.CANCEL }),
		)
		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('asks for both fields before submitting, focusing the first', async () => {
		const { onSubmit } = renderForm()
		send()
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
		expect(
			screen.getByText(CHANGE_EMAIL_CONFIG.CURRENT_REQUIRED),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
		await waitFor(() => expect(newEmailField()).toHaveFocus())
	})

	it('focuses Current password when only it is missing', async () => {
		const { onSubmit } = renderForm()
		fill('new@example.com', '')
		send()
		expect(
			screen.getByText(CHANGE_EMAIL_CONFIG.CURRENT_REQUIRED),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
		await waitFor(() => expect(currentField()).toHaveFocus())
	})

	it('refuses an invalid email', () => {
		const { onSubmit } = renderForm()
		fill('not-an-email', 'secret-password')
		send()
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
		expect(newEmailField()).toHaveAttribute('aria-invalid', 'true')
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('refuses the current email, ignoring case and spaces', () => {
		const { onSubmit } = renderForm()
		fill(' ANA@Example.com ', 'secret-password')
		send()
		expect(
			screen.getByText(CHANGE_EMAIL_CONFIG.SAME_EMAIL),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('validates a non-empty new email on blur, but not an empty one', () => {
		renderForm()
		fireEvent.blur(newEmailField())
		expect(
			screen.queryByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).not.toBeInTheDocument()
		fireEvent.change(newEmailField(), { target: { value: 'nope' } })
		fireEvent.blur(newEmailField())
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
	})

	it.each([
		[ERROR_MESSAGES.WRONG_CURRENT_PASSWORD, currentField],
		[VALIDATION_MESSAGES.EMAIL_INVALID, newEmailField],
	])('puts "%s" on its field', async (message, field) => {
		renderForm({ onSubmit: vi.fn(() => Promise.resolve(message)) })
		fill('new@example.com', 'secret-password')
		send()
		await waitFor(() => expect(field()).toHaveFocus())
		expect(field()).toHaveAttribute('aria-invalid', 'true')
		expect(screen.getByText(message)).toBeInTheDocument()
	})

	it.each([
		ERROR_MESSAGES.EMAIL_CANNOT_BE_USED,
		ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
	])(
		'shows "%s" as a form alert, focusing the send button',
		async (message) => {
			renderForm({ onSubmit: vi.fn(() => Promise.resolve(message)) })
			fill('new@example.com', 'secret-password')
			send()
			expect(await screen.findByRole('alert')).toHaveTextContent(message)
			await waitFor(() =>
				expect(
					screen.getByRole('button', {
						name: CHANGE_EMAIL_CONFIG.SEND_LINK,
					}),
				).toHaveFocus(),
			)
		},
	)

	it('disables the form while sending', async () => {
		renderForm({ onSubmit: vi.fn(() => new Promise(() => {})) })
		fill('new@example.com', 'secret-password')
		send()
		await waitFor(() => expect(newEmailField()).toBeDisabled())
		expect(currentField()).toBeDisabled()
		expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
		expect(
			screen.getByRole('button', { name: CHANGE_EMAIL_CONFIG.CANCEL }),
		).toBeDisabled()
	})

	it('prefills the new email and shows an initial error, focusing Current password', async () => {
		renderForm({
			initialEmail: 'new@example.com',
			initialError: ERROR_MESSAGES.EMAIL_CHANGE_SIGN_IN_AGAIN,
		})
		expect(newEmailField()).toHaveValue('new@example.com')
		expect(screen.getByRole('alert')).toHaveTextContent(
			ERROR_MESSAGES.EMAIL_CHANGE_SIGN_IN_AGAIN,
		)
		await waitFor(() => expect(currentField()).toHaveFocus())
	})
})
