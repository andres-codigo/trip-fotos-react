import PropTypes from 'prop-types'

import { MESSAGE_ACTIONS } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'

import BaseButton from '@/components/ui/button/BaseButton'

const actionClasses = 'min-h-11 px-4 py-0 font-medium'
// Matches BaseButton's primary look, for the one action that is a mailto link rather than a route
const mailtoClasses =
	'inline-flex min-h-11 items-center justify-center rounded-pill border border-solid border-accent bg-accent px-4 font-medium text-on-accent no-underline hover:border-accent-hover hover:bg-accent-hover active:border-accent-hover active:bg-accent-hover'

const mailtoHref = (email, message) =>
	`mailto:${email}?${new URLSearchParams({
		subject: MESSAGES_CONFIG.REPLY_EMAIL_SUBJECT,
		body: `\n\n> ${message}`,
	})
		.toString()
		.replace(/\+/g, '%20')}`

const MessageActions = ({
	id,
	senderId = null,
	senderName = null,
	senderStatus,
	userEmail = null,
	message,
	createdAt = null,
	sender,
	deleteError = null,
	isRetrying = false,
	onDelete,
	onRetry,
	className,
}) => {
	const canReply =
		senderStatus === SENDER_STATUS.TRAVELLER ||
		senderStatus === SENDER_STATUS.UNKNOWN

	return (
		<>
			<div
				className={cn('flex flex-wrap items-center gap-2', className)}
				data-cy={MESSAGE_ACTIONS.ROOT}>
				{canReply && (
					<BaseButton
						isLink
						modeType="primary"
						to={`${PATHS.TRAVELLERS}/${senderId}/contact`}
						state={{
							replyTo: {
								name: senderName,
								message,
								createdAt,
							},
						}}
						className={actionClasses}
						data-cy={MESSAGE_ACTIONS.REPLY}>
						{MESSAGES_CONFIG.REPLY}
					</BaseButton>
				)}
				{senderStatus === SENDER_STATUS.LEGACY && userEmail && (
					<a
						className={mailtoClasses}
						href={mailtoHref(userEmail, message)}
						data-cy={MESSAGE_ACTIONS.REPLY}>
						{MESSAGES_CONFIG.REPLY_BY_EMAIL}
					</a>
				)}
				<span className="flex-1" />
				<BaseButton
					type="button"
					modeType="text"
					className={cn(
						actionClasses,
						'rounded-pill px-3 text-text-muted hover:bg-danger-surface hover:text-danger-text active:bg-danger-surface active:text-danger-text',
					)}
					aria-label={MESSAGES_CONFIG.DELETE_LABEL(sender)}
					onClick={() => onDelete(id)}
					data-cy={MESSAGE_ACTIONS.DELETE}>
					{MESSAGES_CONFIG.DELETE}
				</BaseButton>
			</div>
			{deleteError && (
				<div
					role="alert"
					className="mt-3 flex flex-wrap items-center gap-2.5 rounded-sm border border-danger bg-danger-surface px-3 py-2.5 text-sm"
					data-cy={MESSAGE_ACTIONS.DELETE_ERROR}>
					<span className="min-w-40 flex-1">{deleteError}</span>
					<BaseButton
						type="button"
						modeType="text"
						isDisabled={isRetrying}
						aria-busy={isRetrying}
						className={cn(
							actionClasses,
							'rounded-pill px-3 text-danger-text',
						)}
						onClick={() => onRetry(id)}
						data-cy={MESSAGE_ACTIONS.TRY_AGAIN}>
						{isRetrying
							? MESSAGES_CONFIG.TRYING_AGAIN
							: MESSAGES_CONFIG.TRY_AGAIN}
					</BaseButton>
				</div>
			)}
		</>
	)
}

MessageActions.propTypes = {
	id: PropTypes.string.isRequired,
	senderId: PropTypes.string,
	senderName: PropTypes.string,
	senderStatus: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	userEmail: PropTypes.string,
	message: PropTypes.string.isRequired,
	createdAt: PropTypes.number,
	sender: PropTypes.string,
	deleteError: PropTypes.string,
	isRetrying: PropTypes.bool,
	onDelete: PropTypes.func.isRequired,
	onRetry: PropTypes.func.isRequired,
	className: PropTypes.string,
}

export default MessageActions
