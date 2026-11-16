import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { CHANGE_PASSWORD_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import ChangePasswordForm from '@/components/forms/change-password/ChangePasswordForm'

const renderForm = ({
	onSubmit = vi.fn(() => Promise.resolve()),
	onCancel = vi.fn(),
} = {}) => {
	render(
		<ChangePasswordForm
			onSubmit={onSubmit}
			onCancel={onCancel}
		/>,
	)
	return { onSubmit, onCancel }
}

const getField = (label) => screen.getByLabelText(new RegExp(`^${label}`))

describe('<ChangePasswordForm />', () => {
	it('names the form after its heading and submits both passwords', async () => {
		const { onSubmit } = renderForm()
		expect(
			screen.getByRole('form', { name: CHANGE_PASSWORD_CONFIG.TITLE }),
		).toBeInTheDocument()
		fireEvent.change(
			getField(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
			{
				target: { value: 'old-password' },
			},
		)
		fireEvent.change(getField(CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL), {
			target: { value: 'new-password' },
		})
		fireEvent.click(
			screen.getByRole('button', {
				name: CHANGE_PASSWORD_CONFIG.SAVE_PASSWORD,
			}),
		)
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				currentPassword: 'old-password',
				newPassword: 'new-password',
			}),
		)
	})

	it('calls onCancel from the Cancel button', () => {
		const { onCancel, onSubmit } = renderForm()
		fireEvent.click(
			screen.getByRole('button', { name: CHANGE_PASSWORD_CONFIG.CANCEL }),
		)
		expect(onCancel).toHaveBeenCalledTimes(1)
		expect(onSubmit).not.toHaveBeenCalled()
	})

	const fill = (current, next) => {
		fireEvent.change(
			getField(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
			{ target: { value: current } },
		)
		fireEvent.change(getField(CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL), {
			target: { value: next },
		})
	}

	const save = () =>
		fireEvent.click(
			screen.getByRole('button', {
				name: CHANGE_PASSWORD_CONFIG.SAVE_PASSWORD,
			}),
		)

	it('starts with focus in Current password', async () => {
		renderForm()
		await waitFor(() =>
			expect(
				getField(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
			).toHaveFocus(),
		)
	})

	it('asks for both fields before submitting, focusing the first', async () => {
		const { onSubmit } = renderForm()
		save()
		expect(
			screen.getByText(CHANGE_PASSWORD_CONFIG.CURRENT_REQUIRED),
		).toBeInTheDocument()
		expect(
			screen.getByText(VALIDATION_MESSAGES.PASSWORD_REQUIRED),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
		await waitFor(() =>
			expect(
				getField(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
			).toHaveFocus(),
		)
	})

	it('refuses a short new password, focusing it', async () => {
		const { onSubmit } = renderForm()
		fill('old-password', 'abc')
		save()
		expect(
			screen.getByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
		await waitFor(() =>
			expect(
				getField(CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL),
			).toHaveFocus(),
		)
	})

	it.each([
		[
			ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
			CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL,
		],
		[
			VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
			CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL,
		],
	])('puts "%s" on its field', async (message, label) => {
		renderForm({ onSubmit: vi.fn(() => Promise.resolve(message)) })
		fill('old-password', 'new-password')
		save()
		await waitFor(() => expect(getField(label)).toHaveFocus())
		expect(getField(label)).toHaveAttribute('aria-invalid', 'true')
		expect(screen.getByText(message)).toBeInTheDocument()
	})

	it.each([
		ERROR_MESSAGES.TOO_MANY_ATTEMPTS,
		ERROR_MESSAGES.PASSWORD_CHANGE_FAILED,
	])('shows "%s" as a form alert', async (message) => {
		renderForm({ onSubmit: vi.fn(() => Promise.resolve(message)) })
		fill('old-password', 'new-password')
		save()
		expect(await screen.findByRole('alert')).toHaveTextContent(message)
	})

	it('disables the form while saving', async () => {
		renderForm({ onSubmit: vi.fn(() => new Promise(() => {})) })
		fill('old-password', 'new-password')
		save()
		await waitFor(() =>
			expect(
				getField(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
			).toBeDisabled(),
		)
		expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
	})
})
