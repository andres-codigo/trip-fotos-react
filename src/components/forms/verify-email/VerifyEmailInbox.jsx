import { forwardRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { VERIFY_EMAIL_CONFIG } from '@/constants/auth'
import { VERIFY_EMAIL_INBOX } from '@/constants/test'

import BaseButton from '@/components/ui/button/BaseButton'
import InlineAlert from '@/components/ui/inline-alert/InlineAlert'

const titleClasses = 'm-0 text-[1.5rem]'
const viewClasses = 'm-4 flex flex-col gap-4 p-4'
const textLinkClasses =
	'inline-flex min-h-11 items-center text-accent-text underline underline-offset-4 hover:text-accent-hover'

const secondsUntil = (endsAt, now) =>
	endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0

// Keyed by cooldownEndsAt, so a new cooldown mounts afresh and starts its clock from now
export const ResendHint = ({
	cooldownEndsAt,
	isSending,
	onResend,
	hintDataCy,
	sendAgainDataCy = VERIFY_EMAIL_INBOX.SEND_AGAIN,
}) => {
	const [now, setNow] = useState(() => Date.now())
	const secondsLeft = secondsUntil(cooldownEndsAt, now)
	const isCoolingDown = secondsLeft > 0

	useEffect(() => {
		if (!isCoolingDown) return undefined
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [isCoolingDown])

	if (isCoolingDown) {
		return (
			<p
				className="m-0 text-text-muted"
				data-cy={hintDataCy}>
				{VERIFY_EMAIL_CONFIG.COOLDOWN(secondsLeft)}
			</p>
		)
	}

	return (
		<p
			className="m-0 text-text-muted"
			data-cy={hintDataCy}>
			{VERIFY_EMAIL_CONFIG.HINT_PREFIX}{' '}
			{isSending ? (
				VERIFY_EMAIL_CONFIG.SEND_AGAIN
			) : (
				<BaseButton
					type="button"
					modeType="text"
					className={textLinkClasses}
					onClick={onResend}
					data-cy={sendAgainDataCy}>
					{VERIFY_EMAIL_CONFIG.SEND_AGAIN}
				</BaseButton>
			)}
		</p>
	)
}

ResendHint.propTypes = {
	cooldownEndsAt: PropTypes.number,
	isSending: PropTypes.bool,
	onResend: PropTypes.func.isRequired,
	hintDataCy: PropTypes.string,
	sendAgainDataCy: PropTypes.string,
}

const VerifyEmailInbox = forwardRef(
	(
		{
			email,
			resent = false,
			cooldownEndsAt = null,
			isSending = false,
			isChecking = false,
			error = '',
			onResend,
			onCheck,
			onStartAgain,
		},
		titleRef,
	) => (
		<div
			className={viewClasses}
			data-cy={VERIFY_EMAIL_INBOX.ROOT}>
			<h1
				ref={titleRef}
				tabIndex={-1}
				className={titleClasses}>
				{VERIFY_EMAIL_CONFIG.TITLE}
			</h1>
			<div
				role="status"
				className="rounded-md border border-solid border-success bg-surface p-3"
				data-cy={VERIFY_EMAIL_INBOX.STATUS}>
				{resent
					? VERIFY_EMAIL_CONFIG.RESENT_PREFIX
					: VERIFY_EMAIL_CONFIG.SENT_PREFIX}{' '}
				<strong className="font-medium wrap-anywhere">{email}</strong>
				{resent
					? VERIFY_EMAIL_CONFIG.RESENT_SUFFIX
					: VERIFY_EMAIL_CONFIG.SENT_SUFFIX}
			</div>
			{error && (
				<InlineAlert data-cy={VERIFY_EMAIL_INBOX.ERROR}>
					{error}
				</InlineAlert>
			)}
			<ResendHint
				key={cooldownEndsAt ?? 'none'}
				cooldownEndsAt={cooldownEndsAt}
				isSending={isSending}
				onResend={onResend}
			/>
			<BaseButton
				type="button"
				modeType="primary"
				className="self-start [@media(max-width:1024px)]:w-full"
				onClick={onCheck}
				busyLabel={isChecking ? VERIFY_EMAIL_CONFIG.CHECKING : ''}
				data-cy={VERIFY_EMAIL_INBOX.CHECK}>
				{VERIFY_EMAIL_CONFIG.CHECK}
			</BaseButton>
			<p className="m-0 text-text-muted">
				{VERIFY_EMAIL_CONFIG.WRONG_ADDRESS_PROMPT}{' '}
				<BaseButton
					type="button"
					modeType="text"
					className={textLinkClasses}
					onClick={onStartAgain}>
					{VERIFY_EMAIL_CONFIG.START_AGAIN}
				</BaseButton>
			</p>
		</div>
	),
)

VerifyEmailInbox.displayName = 'VerifyEmailInbox'

VerifyEmailInbox.propTypes = {
	email: PropTypes.string.isRequired,
	resent: PropTypes.bool,
	cooldownEndsAt: PropTypes.number,
	isSending: PropTypes.bool,
	isChecking: PropTypes.bool,
	error: PropTypes.string,
	onResend: PropTypes.func.isRequired,
	onCheck: PropTypes.func.isRequired,
	onStartAgain: PropTypes.func.isRequired,
}

export default VerifyEmailInbox
