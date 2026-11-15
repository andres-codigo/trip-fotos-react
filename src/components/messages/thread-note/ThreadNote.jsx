import PropTypes from 'prop-types'

import { THREAD_NOTE } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import { cn } from '@/utils/cn'

// Matches BaseButton's primary look, for the one action that is a mailto link rather than a route
const MAILTO_CLASSES =
	'inline-flex min-h-11 items-center justify-center self-start rounded-pill border border-solid border-accent bg-accent px-4 font-medium text-on-accent no-underline hover:border-accent-hover hover:bg-accent-hover active:border-accent-hover active:bg-accent-hover'

const mailtoHref = (email, message) =>
	`mailto:${email}?${new URLSearchParams({
		subject: MESSAGES_CONFIG.REPLY_EMAIL_SUBJECT,
		body: `\n\n> ${message}`,
	})
		.toString()
		.replace(/\+/g, '%20')}`

function ThreadNote({ status, email = null, message = '', className }) {
	const isLegacy = status === SENDER_STATUS.LEGACY

	return (
		<div
			className={cn(
				'flex flex-col gap-2 border-0 border-t border-solid border-border px-3.5 pt-3 pb-3.5 text-sm text-text-muted',
				className,
			)}
			data-status={status}
			data-cy={THREAD_NOTE.ROOT}>
			{isLegacy ? (
				<>
					<p className="m-0">{MESSAGES_CONFIG.LEGACY_NOTE}</p>
					{email && (
						<>
							<p
								className="m-0 wrap-anywhere text-text"
								data-cy={THREAD_NOTE.EMAIL}>
								{email}
							</p>
							<a
								className={MAILTO_CLASSES}
								href={mailtoHref(email, message)}
								data-cy={THREAD_NOTE.REPLY_BY_EMAIL}>
								{MESSAGES_CONFIG.REPLY_BY_EMAIL}
							</a>
						</>
					)}
				</>
			) : (
				<p className="m-0">
					<strong className="font-medium text-text">
						{MESSAGES_CONFIG.FORMER_NOTE_TITLE}
					</strong>{' '}
					{MESSAGES_CONFIG.FORMER_NOTE}
				</p>
			)}
		</div>
	)
}

ThreadNote.propTypes = {
	status: PropTypes.oneOf([SENDER_STATUS.FORMER, SENDER_STATUS.LEGACY])
		.isRequired,
	email: PropTypes.string,
	message: PropTypes.string,
	className: PropTypes.string,
}

export default ThreadNote
