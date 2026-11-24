import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import {
	ACCOUNT_SETTINGS_CONFIG,
	RESEND_COOLDOWN_SECONDS,
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { ACCOUNT_PAGE } from '@/constants/test'
import { ERROR_MESSAGES } from '@/constants/errors'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import {
	changeEmail,
	changePassword,
	resendEmailChange,
	selectEmailVerified,
	selectUserEmail,
} from '@/store/slices/authenticationSlice'

import useVerifyEmail from '@/utils/useVerifyEmail'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import InlineAlert from '@/components/ui/inline-alert/InlineAlert'
import VerifiedChip from '@/components/ui/verified-chip/VerifiedChip'

import ChangeEmailForm from '@/components/forms/change-email/ChangeEmailForm'
import ChangePasswordForm from '@/components/forms/change-password/ChangePasswordForm'
import { ResendHint } from '@/components/forms/verify-email/VerifyEmailInbox'

const CHANGE_EMAIL_ID = 'account-change-email'
const CHANGE_PASSWORD_ID = 'account-change-password'
const EMAIL_SENT_ID = 'account-email-sent'

const FORMS = Object.freeze({ EMAIL: 'email', PASSWORD: 'password' })

const NO_CHANGE = {
	pendingEmail: '',
	cooldownEndsAt: null,
	isSending: false,
	error: '',
	reopen: null,
}

const sectionClasses =
	'flex flex-col gap-3 border-0 border-t border-solid border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0'
const headingClasses = 'm-0 text-xl'
const buttonClasses = 'self-start [@media(max-width:1024px)]:w-full'
const statusClasses =
	'm-0 rounded-md border border-solid border-success bg-surface p-3'

const EmailChangeSent = ({ email, change, onResend }) => (
	<>
		<div
			id={EMAIL_SENT_ID}
			tabIndex={-1}
			role="status"
			className={statusClasses}
			data-cy={ACCOUNT_PAGE.EMAIL_SENT}>
			{ACCOUNT_SETTINGS_CONFIG.EMAIL_SENT_PREFIX}{' '}
			<strong className="font-medium wrap-anywhere">
				{change.pendingEmail}
			</strong>
			{ACCOUNT_SETTINGS_CONFIG.EMAIL_SENT_SUFFIX(email)}
		</div>
		{change.error && (
			<InlineAlert data-cy={ACCOUNT_PAGE.EMAIL_SENT_ERROR}>
				{change.error}
			</InlineAlert>
		)}
		<ResendHint
			key={change.cooldownEndsAt ?? 'none'}
			cooldownEndsAt={change.cooldownEndsAt}
			isSending={change.isSending}
			onResend={onResend}
			hintDataCy={ACCOUNT_PAGE.EMAIL_SENT_HINT}
			sendAgainDataCy={ACCOUNT_PAGE.EMAIL_SEND_AGAIN}
		/>
	</>
)

EmailChangeSent.propTypes = {
	email: PropTypes.string.isRequired,
	change: PropTypes.shape({
		pendingEmail: PropTypes.string.isRequired,
		cooldownEndsAt: PropTypes.number,
		isSending: PropTypes.bool,
		error: PropTypes.string,
	}).isRequired,
	onResend: PropTypes.func.isRequired,
}

const EmailSection = ({ isOpen, onOpen, onClose }) => {
	const dispatch = useDispatch()
	const email = useSelector(selectUserEmail)
	const emailVerified = useSelector(selectEmailVerified)
	const { status, resend } = useVerifyEmail()
	const [change, setChange] = useState(NO_CHANGE)
	// Focus moves only after the render that shows its target, never on the first one
	const [focusTarget, setFocusTarget] = useState(null)

	useEffect(() => {
		if (focusTarget) document.getElementById(focusTarget.id)?.focus()
	}, [focusTarget])

	const open = () => {
		setChange(NO_CHANGE)
		onOpen()
	}

	const cancel = () => {
		setChange(NO_CHANGE)
		onClose()
		setFocusTarget({ id: CHANGE_EMAIL_ID })
	}

	const handleSubmit = async (fields) => {
		const result = await dispatch(changeEmail(fields))
		if (changeEmail.rejected.match(result)) return result.payload

		setChange({ ...NO_CHANGE, pendingEmail: result.payload })
		onClose()
		setFocusTarget({ id: EMAIL_SENT_ID })
		return ''
	}

	const resendChange = async () => {
		setChange((current) => ({ ...current, isSending: true, error: '' }))
		const result = await dispatch(resendEmailChange(change.pendingEmail))
		if (resendEmailChange.fulfilled.match(result)) {
			setChange((current) => ({
				...current,
				isSending: false,
				cooldownEndsAt: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
			}))
			return
		}
		// Firebase wants a recent sign-in again, so the form reopens with the new address kept
		if (result.payload === ERROR_MESSAGES.EMAIL_CHANGE_SIGN_IN_AGAIN) {
			setChange({
				...NO_CHANGE,
				reopen: {
					email: change.pendingEmail,
					error: result.payload,
				},
			})
			onOpen()
			return
		}
		setChange((current) => ({
			...current,
			isSending: false,
			error: result.payload,
		}))
	}

	const changeEmailArea = () => {
		if (isOpen) {
			return (
				<ChangeEmailForm
					currentEmail={email ?? ''}
					initialEmail={change.reopen?.email}
					initialError={change.reopen?.error}
					onSubmit={handleSubmit}
					onCancel={cancel}
				/>
			)
		}
		if (change.pendingEmail) {
			return (
				<EmailChangeSent
					email={email ?? ''}
					change={change}
					onResend={resendChange}
				/>
			)
		}
		return (
			<BaseButton
				id={CHANGE_EMAIL_ID}
				type="button"
				modeType="outline"
				className={buttonClasses}
				onClick={open}
				data-cy={ACCOUNT_PAGE.CHANGE_EMAIL}>
				{ACCOUNT_SETTINGS_CONFIG.CHANGE_EMAIL}
			</BaseButton>
		)
	}

	return (
		<div
			className={sectionClasses}
			data-cy={ACCOUNT_PAGE.EMAIL_SECTION}>
			<h2 className={headingClasses}>
				{ACCOUNT_SETTINGS_CONFIG.EMAIL_HEADING}
			</h2>
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<span
					className="text-[1.0625rem] font-medium wrap-anywhere"
					data-cy={ACCOUNT_PAGE.EMAIL}>
					{email}
				</span>
				<VerifiedChip verified={emailVerified} />
			</div>
			{!emailVerified && (
				<>
					<p className="m-0 text-sm text-text-muted">
						{ACCOUNT_SETTINGS_CONFIG.VERIFY_TEXT}
					</p>
					{status === VERIFY_EMAIL_STATUS.SENT && (
						<p
							role="status"
							className={statusClasses}
							data-cy={ACCOUNT_PAGE.EMAIL_MESSAGE}>
							{VERIFY_EMAIL_PROMPT_CONFIG.SENT_TO(email)}
						</p>
					)}
					{status === VERIFY_EMAIL_STATUS.NOT_SENT && (
						<ErrorMessage
							className="m-0 text-sm text-danger-text"
							data-cy={ACCOUNT_PAGE.EMAIL_MESSAGE}>
							{VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT}
						</ErrorMessage>
					)}
					{/* Hidden while a sent link's line shows, as on the strip, so a second email is not sent at once */}
					{status !== VERIFY_EMAIL_STATUS.SENT && (
						<BaseButton
							type="button"
							modeType="primary"
							className={buttonClasses}
							onClick={resend}
							busyLabel={
								status === VERIFY_EMAIL_STATUS.SENDING
									? VERIFY_EMAIL_PROMPT_CONFIG.SENDING
									: ''
							}
							data-cy={ACCOUNT_PAGE.SEND_AGAIN}>
							{VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN}
						</BaseButton>
					)}
				</>
			)}
			{changeEmailArea()}
		</div>
	)
}

EmailSection.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onOpen: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
}

const PasswordSection = ({ isOpen, onOpen, onClose }) => {
	const dispatch = useDispatch()
	const [isChanged, setIsChanged] = useState(false)
	// Focus moves only after the render that shows its target, never on the first one
	const [focusTarget, setFocusTarget] = useState(null)

	useEffect(() => {
		if (focusTarget) document.getElementById(focusTarget.id)?.focus()
	}, [focusTarget])

	const close = () => {
		onClose()
		setFocusTarget({ id: CHANGE_PASSWORD_ID })
	}

	const handleSubmit = async (passwords) => {
		const result = await dispatch(changePassword(passwords))
		if (changePassword.rejected.match(result)) return result.payload

		setIsChanged(true)
		close()
		return ''
	}

	return (
		<div
			className={sectionClasses}
			data-cy={ACCOUNT_PAGE.PASSWORD_SECTION}>
			<h2 className={headingClasses}>
				{ACCOUNT_SETTINGS_CONFIG.PASSWORD_HEADING}
			</h2>
			{isOpen ? (
				<ChangePasswordForm
					onSubmit={handleSubmit}
					onCancel={close}
				/>
			) : (
				<>
					{isChanged ? (
						<p
							role="status"
							className={statusClasses}
							data-cy={ACCOUNT_PAGE.PASSWORD_CHANGED}>
							{ACCOUNT_SETTINGS_CONFIG.PASSWORD_CHANGED}
						</p>
					) : (
						<p className="m-0 text-sm text-text-muted">
							{ACCOUNT_SETTINGS_CONFIG.PASSWORD_HELP}
						</p>
					)}
					<BaseButton
						id={CHANGE_PASSWORD_ID}
						type="button"
						modeType="outline"
						className={buttonClasses}
						onClick={() => {
							setIsChanged(false)
							onOpen()
						}}
						data-cy={ACCOUNT_PAGE.CHANGE_PASSWORD}>
						{ACCOUNT_SETTINGS_CONFIG.CHANGE_PASSWORD}
					</BaseButton>
				</>
			)}
		</div>
	)
}

PasswordSection.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onOpen: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
}

const Account = () => {
	// One form is open at a time
	const [openForm, setOpenForm] = useState(null)
	const formProps = (form) => ({
		isOpen: openForm === form,
		onOpen: () => setOpenForm(form),
		onClose: () => setOpenForm(null),
	})

	return (
		<main
			id={ACCESSIBILITY.MAIN_CONTENT_ID}
			tabIndex={-1}
			className="mainContainer cardPage"
			data-cy="main-container"
			data-cy-alt="account-main-container">
			<title>{`${ACCOUNT_SETTINGS_CONFIG.PAGE_TITLE} · ${GLOBAL.SITE_NAME}`}</title>
			<BaseCard>
				<div className="m-4 flex flex-col gap-5 p-4">
					<h1
						tabIndex={-1}
						className="m-0 text-title font-bold lg:text-display"
						data-cy={ACCOUNT_PAGE.TITLE}>
						{ACCOUNT_SETTINGS_CONFIG.TITLE}
					</h1>
					<EmailSection {...formProps(FORMS.EMAIL)} />
					<PasswordSection {...formProps(FORMS.PASSWORD)} />
				</div>
			</BaseCard>
		</main>
	)
}

export default Account
