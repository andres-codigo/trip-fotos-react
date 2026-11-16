import { useRef } from 'react'
import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import {
	VERIFY_EMAIL_PROMPT_CONFIG,
	VERIFY_EMAIL_STATUS,
} from '@/constants/auth'
import { VERIFY_EMAIL_NOTE } from '@/constants/test'

import { cn } from '@/utils/cn'
import useVerifyEmail from '@/utils/useVerifyEmail'

import BaseButton from '@/components/ui/button/BaseButton'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'
import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

const noteVariants = cva('text-[0.9375rem]', {
	variants: {
		variant: {
			card: 'flex items-start gap-3 rounded-md border border-solid border-accent-text bg-surface-accent px-3.5 py-3',
			bar: 'flex flex-col gap-1.5 border-0 border-t border-solid border-border bg-bg px-3.5 pt-3 pb-3.5',
		},
	},
	defaultVariants: { variant: 'card' },
})

const textLinkClasses =
	'inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-accent-hover'

const BUSY_LABELS = {
	[VERIFY_EMAIL_STATUS.SENDING]: VERIFY_EMAIL_PROMPT_CONFIG.SENDING,
	[VERIFY_EMAIL_STATUS.CHECKING]: VERIFY_EMAIL_PROMPT_CONFIG.CHECKING,
}

const ERROR_MESSAGES = {
	[VERIFY_EMAIL_STATUS.NOT_SENT]: VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT,
	[VERIFY_EMAIL_STATUS.NOT_YET]: VERIFY_EMAIL_PROMPT_CONFIG.NOT_YET,
	[VERIFY_EMAIL_STATUS.CHECK_FAILED]: VERIFY_EMAIL_PROMPT_CONFIG.CHECK_FAILED,
}

const StatusLine = ({ status, className }) => {
	if (status === VERIFY_EMAIL_STATUS.SENT) {
		return (
			<p
				role="status"
				className={cn('m-0 text-sm', className)}
				data-cy={VERIFY_EMAIL_NOTE.MESSAGE}>
				{VERIFY_EMAIL_PROMPT_CONFIG.SENT}
			</p>
		)
	}
	if (ERROR_MESSAGES[status]) {
		return (
			<ErrorMessage
				className={cn('m-0 text-sm text-danger-text', className)}
				data-cy={VERIFY_EMAIL_NOTE.MESSAGE}>
				{ERROR_MESSAGES[status]}
			</ErrorMessage>
		)
	}
	return null
}

StatusLine.propTypes = {
	status: PropTypes.string.isRequired,
	className: PropTypes.string,
}

const Actions = ({ status, resend, check, className }) => {
	const busyLabel = BUSY_LABELS[status]
	const actionsRef = useRef(null)
	// The clicked link gives way to the busy line, so focus waits on the actions rather than dropping to the page
	const keepFocus = (action) => () => {
		actionsRef.current?.focus()
		action()
	}

	return (
		<div
			ref={actionsRef}
			tabIndex={-1}
			className={cn('outline-none', className)}>
			{busyLabel ? (
				<Busy label={busyLabel} />
			) : (
				<Links
					resend={keepFocus(resend)}
					check={keepFocus(check)}
				/>
			)}
		</div>
	)
}

Actions.propTypes = {
	status: PropTypes.string.isRequired,
	resend: PropTypes.func.isRequired,
	check: PropTypes.func.isRequired,
	className: PropTypes.string,
}

const Busy = ({ label }) => (
	<div data-cy={VERIFY_EMAIL_NOTE.BUSY}>
		<BaseSpinner
			label={label}
			className="inline-flex h-auto min-h-11 w-auto justify-start gap-2 [&_[data-cy=base-spinner-icon]]:size-4 [&_[data-cy=base-spinner-icon]]:border-2"
		/>
	</div>
)

Busy.propTypes = {
	label: PropTypes.string.isRequired,
}

const Links = ({ resend, check }) => (
	<div className="flex flex-wrap gap-x-4 gap-y-1">
		<BaseButton
			type="button"
			modeType="text"
			className={textLinkClasses}
			onClick={resend}
			data-cy={VERIFY_EMAIL_NOTE.SEND_AGAIN}>
			{VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN}
		</BaseButton>
		<BaseButton
			type="button"
			modeType="text"
			className={textLinkClasses}
			onClick={check}
			data-cy={VERIFY_EMAIL_NOTE.CHECK}>
			{VERIFY_EMAIL_PROMPT_CONFIG.CHECK}
		</BaseButton>
	</div>
)

Links.propTypes = {
	resend: PropTypes.func.isRequired,
	check: PropTypes.func.isRequired,
}

const Email = ({ email }) => (
	<>
		{VERIFY_EMAIL_PROMPT_CONFIG.SENT_LINK_TO}{' '}
		<span className="wrap-anywhere">{email}</span>.
	</>
)

Email.propTypes = {
	email: PropTypes.string,
}

const VerifyEmailNote = ({ variant = 'card', text = '', className }) => {
	const { email, status, resend, check } = useVerifyEmail()

	if (variant === 'bar') {
		return (
			<div
				className={cn(noteVariants({ variant }), className)}
				data-variant={variant}
				data-cy={VERIFY_EMAIL_NOTE.ROOT}>
				<span>
					<strong
						className="font-medium"
						data-cy={VERIFY_EMAIL_NOTE.TITLE}>
						{VERIFY_EMAIL_PROMPT_CONFIG.REPLY_NOTE_TITLE}
					</strong>{' '}
					<Email email={email} />
				</span>
				<StatusLine status={status} />
				<Actions
					status={status}
					resend={resend}
					check={check}
				/>
			</div>
		)
	}

	return (
		<div
			className={cn(noteVariants({ variant }), className)}
			data-variant={variant}
			data-cy={VERIFY_EMAIL_NOTE.ROOT}>
			<svg
				aria-hidden="true"
				focusable="false"
				className="mt-0.5 size-5 flex-none text-accent-text"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round">
				<rect
					x="3"
					y="5"
					width="18"
					height="14"
					rx="2"
				/>
				<path d="m3 7 9 6 9-6" />
			</svg>
			<div className="flex min-w-0 flex-col gap-1">
				<strong
					className="font-medium"
					data-cy={VERIFY_EMAIL_NOTE.TITLE}>
					{VERIFY_EMAIL_PROMPT_CONFIG.NOTE_TITLE}
				</strong>
				<span>
					{text && `${text} `}
					<Email email={email} />
				</span>
				<StatusLine
					status={status}
					className="mt-1"
				/>
				<Actions
					status={status}
					resend={resend}
					check={check}
					className="mt-1"
				/>
			</div>
		</div>
	)
}

VerifyEmailNote.propTypes = {
	variant: PropTypes.oneOf(['card', 'bar']),
	text: PropTypes.string,
	className: PropTypes.string,
}

export default VerifyEmailNote
