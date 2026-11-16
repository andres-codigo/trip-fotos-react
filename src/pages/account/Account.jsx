import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
	ACCOUNT_SETTINGS_CONFIG,
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { ACCOUNT_PAGE } from '@/constants/test'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import {
	changePassword,
	selectEmailVerified,
	selectUserEmail,
} from '@/store/slices/authenticationSlice'

import useVerifyEmail from '@/utils/useVerifyEmail'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseCard from '@/components/ui/card/BaseCard'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import VerifiedChip from '@/components/ui/verified-chip/VerifiedChip'

import ChangePasswordForm from '@/components/forms/change-password/ChangePasswordForm'

const CHANGE_PASSWORD_ID = 'account-change-password'

const sectionClasses =
	'flex flex-col gap-3 border-0 border-t border-solid border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0'
const headingClasses = 'm-0 text-xl'
const buttonClasses = 'self-start [@media(max-width:1024px)]:w-full'
const statusClasses =
	'm-0 rounded-md border border-solid border-success bg-surface p-3'

const EmailSection = () => {
	const email = useSelector(selectUserEmail)
	const emailVerified = useSelector(selectEmailVerified)
	const { status, resend } = useVerifyEmail()

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
		</div>
	)
}

const PasswordSection = () => {
	const dispatch = useDispatch()
	const [isOpen, setIsOpen] = useState(false)
	const [isChanged, setIsChanged] = useState(false)
	// Focus returns to Change password only after the form has closed, never on the first render
	const returnFocus = useRef(false)

	useEffect(() => {
		if (!isOpen && returnFocus.current) {
			returnFocus.current = false
			document.getElementById(CHANGE_PASSWORD_ID)?.focus()
		}
	}, [isOpen])

	const close = () => {
		returnFocus.current = true
		setIsOpen(false)
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
							setIsOpen(true)
						}}
						data-cy={ACCOUNT_PAGE.CHANGE_PASSWORD}>
						{ACCOUNT_SETTINGS_CONFIG.CHANGE_PASSWORD}
					</BaseButton>
				</>
			)}
		</div>
	)
}

const Account = () => {
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
						className="m-0 text-[1.5rem]"
						data-cy={ACCOUNT_PAGE.TITLE}>
						{ACCOUNT_SETTINGS_CONFIG.TITLE}
					</h1>
					<EmailSection />
					<PasswordSection />
				</div>
			</BaseCard>
		</main>
	)
}

export default Account
