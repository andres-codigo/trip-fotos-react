import { useRef } from 'react'
import PropTypes from 'prop-types'

import {
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { VERIFY_EMAIL_STRIP } from '@/constants/test'
import { cn } from '@/utils/cn'
import useVerifyEmail from '@/utils/useVerifyEmail'

import BaseButton from '@/components/ui/button/BaseButton'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'

const textLinkClasses =
	'inline-flex min-h-11 items-center text-sm text-accent-text underline underline-offset-4 hover:text-accent-hover'
const lineClasses = 'm-0 flex min-h-11 items-center text-sm'

const BUSY_LABELS = {
	[VERIFY_EMAIL_STATUS.SENDING]: VERIFY_EMAIL_PROMPT_CONFIG.SENDING,
	[VERIFY_EMAIL_STATUS.CHECKING]: VERIFY_EMAIL_PROMPT_CONFIG.CHECKING,
}

const ALERTS = {
	[VERIFY_EMAIL_STATUS.NOT_YET]: VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET,
	[VERIFY_EMAIL_STATUS.CHECK_FAILED]: VERIFY_EMAIL_PROMPT_CONFIG.CHECK_FAILED,
}

const MailIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
		className="mt-0.75 size-5 flex-none text-accent-text md:mt-0">
		<rect
			width="20"
			height="16"
			x="2"
			y="4"
			rx="2"
		/>
		<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
	</svg>
)

const Links = ({ onResend, onCheck }) => (
	<>
		<BaseButton
			type="button"
			modeType="text"
			className={textLinkClasses}
			onClick={onResend}
			data-cy={VERIFY_EMAIL_STRIP.SEND_AGAIN}>
			{VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN}
		</BaseButton>
		<BaseButton
			type="button"
			modeType="text"
			className={textLinkClasses}
			onClick={onCheck}
			data-cy={VERIFY_EMAIL_STRIP.CHECK}>
			{VERIFY_EMAIL_PROMPT_CONFIG.CHECK}
		</BaseButton>
	</>
)

Links.propTypes = {
	onResend: PropTypes.func.isRequired,
	onCheck: PropTypes.func.isRequired,
}

const Actions = ({ email, status, onResend, onCheck }) => {
	if (BUSY_LABELS[status]) {
		return (
			<div data-cy={VERIFY_EMAIL_STRIP.BUSY}>
				<BaseSpinner
					label={BUSY_LABELS[status]}
					className="inline-flex min-h-11 w-auto justify-start gap-2 text-sm [&_[data-cy=base-spinner-icon]]:size-3.5 [&_[data-cy=base-spinner-icon]]:border-2"
				/>
			</div>
		)
	}

	if (status === VERIFY_EMAIL_STATUS.SENT) {
		return (
			<p
				role="status"
				className={lineClasses}
				data-cy={VERIFY_EMAIL_STRIP.MESSAGE}>
				{VERIFY_EMAIL_PROMPT_CONFIG.SENT_TO(email)}
			</p>
		)
	}

	if (status === VERIFY_EMAIL_STATUS.NOT_SENT) {
		return (
			<ErrorMessage
				className={cn(lineClasses, 'text-danger-text')}
				data-cy={VERIFY_EMAIL_STRIP.MESSAGE}>
				{VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT}
			</ErrorMessage>
		)
	}

	return (
		<>
			{ALERTS[status] && (
				<ErrorMessage
					className={cn(lineClasses, 'text-danger-text')}
					data-cy={VERIFY_EMAIL_STRIP.MESSAGE}>
					{ALERTS[status]}
				</ErrorMessage>
			)}
			<Links
				onResend={onResend}
				onCheck={onCheck}
			/>
		</>
	)
}

Actions.propTypes = {
	email: PropTypes.string,
	status: PropTypes.string.isRequired,
	onResend: PropTypes.func.isRequired,
	onCheck: PropTypes.func.isRequired,
}

const VerifyEmailStrip = ({ className }) => {
	const { email, status, resend, check } = useVerifyEmail()
	const actionsRef = useRef(null)
	// The clicked link gives way to the busy line, so focus waits on the actions rather than dropping to the page
	const keepFocus = (action) => () => {
		actionsRef.current?.focus()
		action()
	}

	// Moved below the fixed header without taking space, so each page's own top padding still clears both; above the page, whose padding overlaps it
	return (
		<div
			role="region"
			aria-label={VERIFY_EMAIL_PROMPT_CONFIG.STRIP_LABEL}
			className={cn(
				'relative top-20 z-[1] w-full border-0 border-b border-solid border-accent-text bg-surface-accent px-4 py-2.5 text-[0.9375rem] md:px-6',
				className,
			)}
			data-cy={VERIFY_EMAIL_STRIP.ROOT}>
			<div className="mx-auto flex w-full max-w-290 items-start gap-2.5 md:items-center md:gap-3">
				<MailIcon />
				{/* One row from 768px: the prompt, then its links */}
				<div className="min-w-0 flex-1 md:flex md:items-center md:gap-3">
					<p className="m-0 md:min-w-0 md:flex-1">
						<strong className="font-medium">
							{VERIFY_EMAIL_PROMPT_CONFIG.STRIP_TITLE}
						</strong>{' '}
						{VERIFY_EMAIL_PROMPT_CONFIG.STRIP_TEXT}{' '}
						{VERIFY_EMAIL_PROMPT_CONFIG.SENT_LINK_TO}{' '}
						<span
							className="wrap-anywhere"
							data-cy={VERIFY_EMAIL_STRIP.EMAIL}>
							{email}
						</span>
						.
					</p>
					<div
						ref={actionsRef}
						tabIndex={-1}
						className="flex flex-wrap items-center gap-x-4 gap-y-1 outline-none md:flex-none">
						<Actions
							email={email}
							status={status}
							onResend={keepFocus(resend)}
							onCheck={keepFocus(check)}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

VerifyEmailStrip.propTypes = {
	className: PropTypes.string,
}

export default VerifyEmailStrip
