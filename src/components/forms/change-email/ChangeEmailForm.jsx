import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { CHANGE_EMAIL_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { CHANGE_EMAIL_FORM } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import { cn } from '@/utils/cn'
import { validateEmail } from '@/utils/validation'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import InlineAlert from '@/components/ui/inline-alert/InlineAlert'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

const NEW_EMAIL_ID = 'change-email-new'
const CURRENT_PASSWORD_ID = 'change-email-current'
const SEND_LINK_ID = 'change-email-send-link'
const TITLE_ID = 'change-email-title'
const INTRO_ID = 'change-email-intro'

const EMPTY = { value: '', isValid: true, message: '' }

const validateCurrent = (value) =>
	value
		? { value, isValid: true, message: '' }
		: {
				value,
				isValid: false,
				message: CHANGE_EMAIL_CONFIG.CURRENT_REQUIRED,
			}

const validateNewEmail = (value, currentEmail) => {
	const trimmed = value.trim()
	const checked = validateEmail(trimmed)
	if (!checked.isValid) return { value, ...checked }
	if (trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
		return {
			value,
			isValid: false,
			message: CHANGE_EMAIL_CONFIG.SAME_EMAIL,
		}
	}
	return { value, isValid: true, message: '' }
}

// Typing never raises a new error; it only clears or updates one the field already shows
const onType = (field, validate, value) =>
	field.isValid ? { ...EMPTY, value } : validate(value)

const ChangeEmailForm = ({
	currentEmail,
	onSubmit,
	onCancel,
	initialEmail = '',
	initialError = '',
	className,
}) => {
	const [newEmail, setNewEmail] = useState({ ...EMPTY, value: initialEmail })
	const [current, setCurrent] = useState(EMPTY)
	const [formError, setFormError] = useState(initialError)
	const [isSending, setIsSending] = useState(false)
	// Focus waits for the render, as the fields are still disabled when a send comes back
	const [focusId, setFocusId] = useState({
		id: initialError ? CURRENT_PASSWORD_ID : NEW_EMAIL_ID,
	})

	useEffect(() => {
		document.getElementById(focusId.id)?.focus()
	}, [focusId])

	const validateNew = (value) => validateNewEmail(value, currentEmail)

	const handleSubmit = async (e) => {
		e.preventDefault()
		const checkedNew = validateNew(newEmail.value)
		const checkedCurrent = validateCurrent(current.value)
		setNewEmail(checkedNew)
		setCurrent(checkedCurrent)
		setFormError('')

		if (!checkedNew.isValid || !checkedCurrent.isValid) {
			setFocusId({
				id: checkedNew.isValid ? CURRENT_PASSWORD_ID : NEW_EMAIL_ID,
			})
			return
		}

		setIsSending(true)
		// The page answers with a message only when the change is refused
		const message = await onSubmit({
			newEmail: newEmail.value.trim(),
			currentPassword: current.value,
		})
		if (!message) return
		setIsSending(false)

		if (message === ERROR_MESSAGES.WRONG_CURRENT_PASSWORD) {
			setCurrent({ ...checkedCurrent, isValid: false, message })
			setFocusId({ id: CURRENT_PASSWORD_ID })
		} else if (message === VALIDATION_MESSAGES.EMAIL_INVALID) {
			setNewEmail({ ...checkedNew, isValid: false, message })
			setFocusId({ id: NEW_EMAIL_ID })
		} else {
			setFormError(message)
			setFocusId({ id: SEND_LINK_ID })
		}
	}

	return (
		<form
			className={cn(
				'flex flex-col gap-3.5 rounded-md border border-solid border-border bg-bg p-4',
				className,
			)}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSending}
			aria-labelledby={TITLE_ID}
			aria-describedby={INTRO_ID}
			data-cy={CHANGE_EMAIL_FORM.ROOT}>
			<h3
				id={TITLE_ID}
				className="m-0 text-[1.0625rem]"
				data-cy={CHANGE_EMAIL_FORM.TITLE}>
				{CHANGE_EMAIL_CONFIG.TITLE}
			</h3>
			<p
				id={INTRO_ID}
				className="m-0 text-sm text-text-muted">
				{CHANGE_EMAIL_CONFIG.INTRO}
			</p>
			<RequiredLegend />
			<LoadingAnnouncement isLoading={isSending} />
			{formError && (
				<InlineAlert data-cy={CHANGE_EMAIL_FORM.ALERT}>
					{formError}
				</InlineAlert>
			)}
			<Input
				id={NEW_EMAIL_ID}
				label={CHANGE_EMAIL_CONFIG.NEW_EMAIL_LABEL}
				type="email"
				autoComplete="email"
				value={newEmail.value}
				onChange={(e) =>
					setNewEmail(onType(newEmail, validateNew, e.target.value))
				}
				onBlur={(e) =>
					e.target.value && setNewEmail(validateNew(e.target.value))
				}
				isValid={newEmail.isValid}
				message={newEmail.message}
				disabled={isSending}
				required
				data-cy={CHANGE_EMAIL_FORM.NEW_EMAIL_INPUT}
				data-cy-error={CHANGE_EMAIL_FORM.NEW_EMAIL_ERROR}
			/>
			<Input
				id={CURRENT_PASSWORD_ID}
				label={CHANGE_EMAIL_CONFIG.CURRENT_PASSWORD_LABEL}
				type="password"
				autoComplete="current-password"
				helpText={CHANGE_EMAIL_CONFIG.CURRENT_PASSWORD_HELP}
				value={current.value}
				onChange={(e) =>
					setCurrent(onType(current, validateCurrent, e.target.value))
				}
				isValid={current.isValid}
				message={current.message}
				disabled={isSending}
				required
				data-cy={CHANGE_EMAIL_FORM.CURRENT_PASSWORD_INPUT}
				data-cy-error={CHANGE_EMAIL_FORM.CURRENT_PASSWORD_ERROR}
			/>
			<div className="flex flex-col-reverse gap-3 lg:flex-row">
				<BaseButton
					type="button"
					modeType="outline"
					onClick={onCancel}
					isDisabled={isSending}
					data-cy={CHANGE_EMAIL_FORM.CANCEL}>
					{CHANGE_EMAIL_CONFIG.CANCEL}
				</BaseButton>
				<BaseButton
					id={SEND_LINK_ID}
					type="submit"
					modeType="primary"
					busyLabel={isSending ? CHANGE_EMAIL_CONFIG.SENDING : ''}
					data-cy={CHANGE_EMAIL_FORM.SEND_LINK}>
					{CHANGE_EMAIL_CONFIG.SEND_LINK}
				</BaseButton>
			</div>
		</form>
	)
}

ChangeEmailForm.propTypes = {
	currentEmail: PropTypes.string.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	initialEmail: PropTypes.string,
	initialError: PropTypes.string,
	className: PropTypes.string,
}

export default ChangeEmailForm
