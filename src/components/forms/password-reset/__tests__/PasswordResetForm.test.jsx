import { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { AUTH_FORM_CONFIG, PASSWORD_RESET_CONFIG } from '@/constants/auth'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import PasswordResetForm from '@/components/forms/password-reset/PasswordResetForm'

const EMAIL = 'name@example.com'

const renderForm = (props = {}) => {
	const onSubmit = vi.fn()
	const onBack = vi.fn()
	const ref = createRef()
	render(
		<PasswordResetForm
			ref={ref}
			onSubmit={onSubmit}
			onBack={onBack}
			{...props}
		/>,
	)
	return { onSubmit, onBack, ref }
}

const getEmail = () =>
	screen.getByRole('textbox', { name: AUTH_FORM_CONFIG.EMAIL_LABEL })
const getSubmit = () =>
	screen.getByRole('button', { name: PASSWORD_RESET_CONFIG.SUBMIT })

describe('<PasswordResetForm />', () => {
	it('seeds the email field from initialEmail', () => {
		renderForm({ initialEmail: EMAIL })
		expect(getEmail()).toHaveValue(EMAIL)
		expect(
			screen.getByRole('heading', {
				level: 1,
				name: PASSWORD_RESET_CONFIG.TITLE,
			}),
		).toBeInTheDocument()
		expect(
			screen.getByText(PASSWORD_RESET_CONFIG.INTRO),
		).toBeInTheDocument()
	})

	it('shows the email message, focuses the field and does not submit when invalid', () => {
		const { onSubmit } = renderForm({ initialEmail: 'not-an-email' })
		fireEvent.click(getSubmit())
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
		expect(getEmail()).toHaveAttribute('aria-invalid', 'true')
		expect(getEmail()).toHaveFocus()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('validates on blur but not while typing into a valid field', () => {
		renderForm()
		fireEvent.change(getEmail(), { target: { value: 'name@' } })
		expect(
			screen.queryByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).not.toBeInTheDocument()
		fireEvent.blur(getEmail())
		expect(
			screen.getByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).toBeInTheDocument()
		fireEvent.change(getEmail(), { target: { value: EMAIL } })
		expect(
			screen.queryByText(VALIDATION_MESSAGES.EMAIL_INVALID),
		).not.toBeInTheDocument()
	})

	it('submits the trimmed email when valid', () => {
		const { onSubmit } = renderForm()
		fireEvent.change(getEmail(), { target: { value: `  ${EMAIL}  ` } })
		fireEvent.click(getSubmit())
		expect(onSubmit).toHaveBeenCalledWith(EMAIL)
	})

	it('shows the busy label, marks the form busy and disables the field while sending', () => {
		renderForm({ initialEmail: EMAIL, status: 'sending' })
		const button = screen.getByRole('button', {
			name: PASSWORD_RESET_CONFIG.BUSY,
		})
		expect(button).toBeDisabled()
		expect(button).toHaveAttribute('aria-busy', 'true')
		expect(button.closest('form')).toHaveAttribute('aria-busy', 'true')
		expect(getEmail()).toBeDisabled()
	})

	it('shows a send failure', () => {
		renderForm({ error: 'Something went wrong' })
		expect(screen.getByRole('alert')).toHaveTextContent(
			'Something went wrong',
		)
	})

	it('calls onBack from the back control', () => {
		const { onBack } = renderForm()
		fireEvent.click(
			screen.getByRole('button', { name: PASSWORD_RESET_CONFIG.BACK }),
		)
		expect(onBack).toHaveBeenCalledTimes(1)
	})

	it('puts the ref on the focusable heading', () => {
		const { ref } = renderForm()
		expect(ref.current).toBe(screen.getByRole('heading', { level: 1 }))
		expect(ref.current).toHaveAttribute('tabindex', '-1')
	})

	describe('sent view', () => {
		const renderSent = () => renderForm({ status: 'sent', sentTo: EMAIL })

		it('shows the sent message as a status', () => {
			const { ref } = renderSent()
			expect(
				screen.getByRole('heading', {
					level: 1,
					name: PASSWORD_RESET_CONFIG.SENT_TITLE,
				}),
			).toBe(ref.current)
			expect(screen.getByRole('status')).toHaveTextContent(
				PASSWORD_RESET_CONFIG.SENT_MESSAGE(EMAIL),
			)
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		})

		it('sends the link again to the same address', () => {
			const { onSubmit } = renderSent()
			fireEvent.click(
				screen.getByRole('button', {
					name: PASSWORD_RESET_CONFIG.SEND_AGAIN,
				}),
			)
			expect(onSubmit).toHaveBeenCalledWith(EMAIL)
		})

		it('calls onBack from both back controls', () => {
			const { onBack } = renderSent()
			const backs = screen.getAllByRole('button', {
				name: PASSWORD_RESET_CONFIG.BACK,
			})
			expect(backs).toHaveLength(2)
			backs.forEach((back) => fireEvent.click(back))
			expect(onBack).toHaveBeenCalledTimes(2)
		})
	})
})
