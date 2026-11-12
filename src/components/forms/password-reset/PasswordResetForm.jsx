import { forwardRef, useState } from 'react'
import PropTypes from 'prop-types'

import { AUTH_FORM_CONFIG, PASSWORD_RESET_CONFIG } from '@/constants/auth'
import { PASSWORD_RESET_FORM } from '@/constants/test'

import { validateEmail } from '@/utils/validation'

import BaseButton from '@/components/ui/button/BaseButton'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import Input from '@/components/ui/form/input/Input'
import RequiredLegend from '@/components/ui/form/required-legend/RequiredLegend'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

const EMAIL_ID = 'reset-email'
const TITLE_ID = 'password-reset-title'

const titleClasses = 'm-0 text-[1.5rem]'
const viewClasses = 'm-4 flex flex-col gap-4 p-4'
const textLinkClasses =
	'inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-accent-hover'

const BackToLogIn = ({ onBack }) => (
	<BaseButton
		type="button"
		modeType="text"
		className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-text-link underline underline-offset-4"
		onClick={onBack}
		ariaLabel={PASSWORD_RESET_CONFIG.BACK}
		data-cy={PASSWORD_RESET_FORM.BACK_TO_LOG_IN}>
		<svg
			aria-hidden="true"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round">
			<path d="m15 18-6-6 6-6" />
		</svg>
		{PASSWORD_RESET_CONFIG.BACK}
	</BaseButton>
)

BackToLogIn.propTypes = {
	onBack: PropTypes.func.isRequired,
}

const PasswordResetForm = forwardRef(
	(
		{
			initialEmail = '',
			status = 'idle',
			error = '',
			sentTo = '',
			onSubmit,
			onBack,
		},
		titleRef,
	) => {
		const [email, setEmail] = useState({
			value: initialEmail,
			isValid: true,
			message: '',
		})

		const isSending = status === 'sending'

		const validate = (value) => {
			const { isValid, message } = validateEmail(value)
			setEmail({ value, isValid, message })
			return isValid
		}

		// Typing never raises a new error; it only clears or updates one the field already shows
		const handleChange = (e) => {
			const { value } = e.target
			if (email.isValid) {
				setEmail({ value, isValid: true, message: '' })
				return
			}
			validate(value.trim())
		}

		const handleSubmit = (e) => {
			e.preventDefault()
			const trimmedEmail = email.value.trim()
			if (!validate(trimmedEmail)) {
				document.getElementById(EMAIL_ID)?.focus()
				return
			}
			onSubmit(trimmedEmail)
		}

		if (status === 'sent') {
			return (
				<div
					className={viewClasses}
					data-cy={PASSWORD_RESET_FORM.SENT}>
					<BackToLogIn onBack={onBack} />
					<h1
						ref={titleRef}
						tabIndex={-1}
						className={titleClasses}
						data-cy={PASSWORD_RESET_FORM.TITLE}>
						{PASSWORD_RESET_CONFIG.SENT_TITLE}
					</h1>
					<div
						role="status"
						className="rounded-md border border-solid border-success bg-surface p-3"
						data-cy={PASSWORD_RESET_FORM.SENT_MESSAGE}>
						{PASSWORD_RESET_CONFIG.SENT_MESSAGE(sentTo)}
					</div>
					<p className="m-0 text-text-muted">
						{PASSWORD_RESET_CONFIG.SENT_HINT_PREFIX}{' '}
						<BaseButton
							type="button"
							modeType="text"
							className={textLinkClasses}
							onClick={() => onSubmit(sentTo)}
							data-cy={PASSWORD_RESET_FORM.SEND_AGAIN}>
							{PASSWORD_RESET_CONFIG.SEND_AGAIN}
						</BaseButton>
					</p>
					<BaseButton
						type="button"
						modeType="outline"
						className="self-start [@media(max-width:1024px)]:w-full"
						onClick={onBack}
						data-cy={PASSWORD_RESET_FORM.BACK}>
						{PASSWORD_RESET_CONFIG.BACK}
					</BaseButton>
				</div>
			)
		}

		return (
			<form
				className={viewClasses}
				onSubmit={handleSubmit}
				noValidate
				aria-busy={isSending}
				aria-labelledby={TITLE_ID}
				data-cy={PASSWORD_RESET_FORM.ROOT}>
				<BackToLogIn onBack={onBack} />
				<div className="flex flex-col gap-2">
					<h1
						ref={titleRef}
						tabIndex={-1}
						id={TITLE_ID}
						className={titleClasses}
						data-cy={PASSWORD_RESET_FORM.TITLE}>
						{PASSWORD_RESET_CONFIG.TITLE}
					</h1>
					<p className="m-0">{PASSWORD_RESET_CONFIG.INTRO}</p>
					<RequiredLegend />
				</div>
				<LoadingAnnouncement isLoading={isSending} />
				<Input
					id={EMAIL_ID}
					label={AUTH_FORM_CONFIG.EMAIL_LABEL}
					type="email"
					autoComplete="email"
					value={email.value}
					onChange={handleChange}
					onBlur={(e) => validate(e.target.value.trim())}
					isValid={email.isValid}
					message={email.message}
					disabled={isSending}
					required
					data-cy={PASSWORD_RESET_FORM.EMAIL_INPUT}
					data-cy-error={PASSWORD_RESET_FORM.EMAIL_ERROR}
				/>
				{error && (
					<ErrorMessage
						className="m-0 text-danger-text"
						data-cy={PASSWORD_RESET_FORM.SEND_ERROR}>
						{error}
					</ErrorMessage>
				)}
				<BaseButton
					type="submit"
					modeType="primary"
					className="self-start [@media(max-width:1024px)]:w-full"
					busyLabel={isSending ? PASSWORD_RESET_CONFIG.BUSY : ''}
					data-cy={PASSWORD_RESET_FORM.SUBMIT}>
					{PASSWORD_RESET_CONFIG.SUBMIT}
				</BaseButton>
			</form>
		)
	},
)

PasswordResetForm.displayName = 'PasswordResetForm'

PasswordResetForm.propTypes = {
	initialEmail: PropTypes.string,
	status: PropTypes.oneOf(['idle', 'sending', 'sent']),
	error: PropTypes.string,
	sentTo: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
	onBack: PropTypes.func.isRequired,
}

export default PasswordResetForm
