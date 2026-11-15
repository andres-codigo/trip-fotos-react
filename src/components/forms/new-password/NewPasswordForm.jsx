import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { AUTH_ACTION_CONFIG, AUTH_FORM_CONFIG } from '@/constants/auth'
import { NEW_PASSWORD_FORM } from '@/constants/test'

import { cn } from '@/utils/cn'
import { validatePassword } from '@/utils/validation'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

const PASSWORD_ID = 'new-password'
const TITLE_ID = 'new-password-title'

const NewPasswordForm = ({ email, onSubmit, className }) => {
	const [password, setPassword] = useState({
		value: '',
		isValid: true,
		message: '',
	})
	const [isSaving, setIsSaving] = useState(false)
	// Focus waits for the render, as the field is still disabled when a save comes back
	const [focusRequest, setFocusRequest] = useState(1)

	useEffect(() => {
		document.getElementById(PASSWORD_ID)?.focus()
	}, [focusRequest])

	const validate = (value) => {
		const { isValid, message } = validatePassword(value)
		setPassword({ value, isValid, message })
		return isValid
	}

	// Typing never raises a new error; it only clears or updates one the field already shows
	const handleChange = (e) => {
		const { value } = e.target
		if (password.isValid) {
			setPassword({ value, isValid: true, message: '' })
			return
		}
		validate(value)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		const { value } = password
		if (!validate(value)) {
			setFocusRequest((request) => request + 1)
			return
		}

		setIsSaving(true)
		// The page answers with a message only when the server refuses the password
		const message = await onSubmit(value)
		setIsSaving(false)
		if (message) {
			setPassword({ value, isValid: false, message })
			setFocusRequest((request) => request + 1)
		}
	}

	return (
		<form
			className={cn('m-4 flex flex-col gap-4 p-4', className)}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSaving}
			aria-labelledby={TITLE_ID}
			data-cy={NEW_PASSWORD_FORM.ROOT}>
			<div className="flex flex-col gap-2">
				<h1
					tabIndex={-1}
					id={TITLE_ID}
					className="m-0 text-[1.5rem]"
					data-cy={NEW_PASSWORD_FORM.TITLE}>
					{AUTH_ACTION_CONFIG.RESET_TITLE}
				</h1>
				<p
					className="m-0"
					data-cy={NEW_PASSWORD_FORM.FOR}>
					{AUTH_ACTION_CONFIG.RESET_FOR(email)}
				</p>
				<RequiredLegend />
			</div>
			<LoadingAnnouncement isLoading={isSaving} />
			<Input
				id={PASSWORD_ID}
				label={AUTH_ACTION_CONFIG.NEW_PASSWORD_LABEL}
				type="password"
				autoComplete="new-password"
				helpText={AUTH_FORM_CONFIG.PASSWORD_HELP}
				value={password.value}
				onChange={handleChange}
				onBlur={(e) => validate(e.target.value)}
				isValid={password.isValid}
				message={password.message}
				disabled={isSaving}
				required
				data-cy={NEW_PASSWORD_FORM.PASSWORD_INPUT}
				data-cy-error={NEW_PASSWORD_FORM.PASSWORD_ERROR}
			/>
			<BaseButton
				type="submit"
				modeType="primary"
				className="self-start [@media(max-width:1024px)]:w-full"
				busyLabel={isSaving ? AUTH_ACTION_CONFIG.SAVING : ''}
				data-cy={NEW_PASSWORD_FORM.SAVE_PASSWORD}>
				{AUTH_ACTION_CONFIG.SAVE_PASSWORD}
			</BaseButton>
		</form>
	)
}

NewPasswordForm.propTypes = {
	email: PropTypes.string.isRequired,
	onSubmit: PropTypes.func.isRequired,
	className: PropTypes.string,
}

export default NewPasswordForm
