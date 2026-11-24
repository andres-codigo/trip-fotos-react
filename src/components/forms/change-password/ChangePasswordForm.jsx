import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { AUTH_FORM_CONFIG, CHANGE_PASSWORD_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { CHANGE_PASSWORD_FORM } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import { cn } from '@/utils/cn'
import { validatePassword } from '@/utils/validation'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import InlineAlert from '@/components/ui/inline-alert/InlineAlert'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

const CURRENT_PASSWORD_ID = 'change-password-current'
const NEW_PASSWORD_ID = 'change-password-new'
const SAVE_ID = 'change-password-save'
const TITLE_ID = 'change-password-title'

const EMPTY = { value: '', isValid: true, message: '' }

const validateCurrent = (value) =>
	value
		? { value, isValid: true, message: '' }
		: {
				value,
				isValid: false,
				message: CHANGE_PASSWORD_CONFIG.CURRENT_REQUIRED,
			}

const validateNew = (value) => ({ value, ...validatePassword(value) })

// Typing never raises a new error; it only clears or updates one the field already shows
const onType = (field, validate, value) =>
	field.isValid ? { ...EMPTY, value } : validate(value)

const ChangePasswordForm = ({ onSubmit, onCancel, className }) => {
	const [current, setCurrent] = useState(EMPTY)
	const [next, setNext] = useState(EMPTY)
	const [formError, setFormError] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	// Focus waits for the render, as the fields are still disabled when a save comes back. On open it goes to the heading, so a phone keeps its keyboard down
	const [focusId, setFocusId] = useState({ id: TITLE_ID })

	useEffect(() => {
		document.getElementById(focusId.id)?.focus()
	}, [focusId])

	const handleSubmit = async (e) => {
		e.preventDefault()
		const checkedCurrent = validateCurrent(current.value)
		const checkedNew = validateNew(next.value)
		setCurrent(checkedCurrent)
		setNext(checkedNew)
		setFormError('')

		if (!checkedCurrent.isValid || !checkedNew.isValid) {
			setFocusId({
				id: checkedCurrent.isValid
					? NEW_PASSWORD_ID
					: CURRENT_PASSWORD_ID,
			})
			return
		}

		setIsSaving(true)
		// The page answers with a message only when the change is refused
		const message = await onSubmit({
			currentPassword: current.value,
			newPassword: next.value,
		})
		if (!message) return
		setIsSaving(false)

		if (message === ERROR_MESSAGES.WRONG_CURRENT_PASSWORD) {
			setCurrent({ ...checkedCurrent, isValid: false, message })
			setFocusId({ id: CURRENT_PASSWORD_ID })
		} else if (message === VALIDATION_MESSAGES.PASSWORD_TOO_SHORT) {
			setNext({ ...checkedNew, isValid: false, message })
			setFocusId({ id: NEW_PASSWORD_ID })
		} else {
			setFormError(message)
			setFocusId({ id: SAVE_ID })
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
			aria-busy={isSaving}
			aria-labelledby={TITLE_ID}
			data-cy={CHANGE_PASSWORD_FORM.ROOT}>
			<h3
				id={TITLE_ID}
				tabIndex={-1}
				className="m-0 text-[1.0625rem]">
				{CHANGE_PASSWORD_CONFIG.TITLE}
			</h3>
			<RequiredLegend />
			<LoadingAnnouncement isLoading={isSaving} />
			{formError && (
				<InlineAlert data-cy={CHANGE_PASSWORD_FORM.ALERT}>
					{formError}
				</InlineAlert>
			)}
			<Input
				id={CURRENT_PASSWORD_ID}
				label={CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL}
				type="password"
				autoComplete="current-password"
				value={current.value}
				onChange={(e) =>
					setCurrent(onType(current, validateCurrent, e.target.value))
				}
				isValid={current.isValid}
				message={current.message}
				disabled={isSaving}
				required
				data-cy={CHANGE_PASSWORD_FORM.CURRENT_PASSWORD_INPUT}
				data-cy-error={CHANGE_PASSWORD_FORM.CURRENT_PASSWORD_ERROR}
			/>
			<Input
				id={NEW_PASSWORD_ID}
				label={CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL}
				type="password"
				autoComplete="new-password"
				helpText={AUTH_FORM_CONFIG.PASSWORD_HELP}
				value={next.value}
				onChange={(e) =>
					setNext(onType(next, validateNew, e.target.value))
				}
				onBlur={(e) =>
					e.target.value && setNext(validateNew(e.target.value))
				}
				isValid={next.isValid}
				message={next.message}
				disabled={isSaving}
				required
				data-cy={CHANGE_PASSWORD_FORM.NEW_PASSWORD_INPUT}
				data-cy-error={CHANGE_PASSWORD_FORM.NEW_PASSWORD_ERROR}
			/>
			<div className="flex flex-col-reverse gap-3 lg:flex-row">
				<BaseButton
					type="button"
					modeType="outline"
					onClick={onCancel}
					isDisabled={isSaving}
					data-cy={CHANGE_PASSWORD_FORM.CANCEL}>
					{CHANGE_PASSWORD_CONFIG.CANCEL}
				</BaseButton>
				<BaseButton
					id={SAVE_ID}
					type="submit"
					modeType="primary"
					busyLabel={isSaving ? CHANGE_PASSWORD_CONFIG.SAVING : ''}
					data-cy={CHANGE_PASSWORD_FORM.SAVE_PASSWORD}>
					{CHANGE_PASSWORD_CONFIG.SAVE_PASSWORD}
				</BaseButton>
			</div>
		</form>
	)
}

ChangePasswordForm.propTypes = {
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	className: PropTypes.string,
}

export default ChangePasswordForm
