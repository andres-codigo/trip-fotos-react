import PropTypes from 'prop-types'

import { MESSAGE_BUBBLE } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import { cn } from '@/utils/cn'
import { formatClockTime, formatFullTime } from '@/utils/formatMessageTime'

const META = 'm-0 flex items-center gap-2 text-xs text-text-muted'

function MessageBubble({
	message,
	isMine,
	senderName,
	createdAt = null,
	status = 'sent',
	showTime = false,
	onRetry,
	className,
}) {
	const isFailed = status === 'failed'
	const isSending = status === 'sending'
	// An email-only message from before conversations has no time
	const when = createdAt === null ? '' : `, ${formatClockTime(createdAt)}`
	const hiddenPrefix = `${isMine ? MESSAGES_CONFIG.YOU : senderName}${when}: `

	return (
		<div
			className={cn(
				'flex w-full flex-col gap-1',
				isMine ? 'items-end' : 'items-start',
				className,
			)}
			data-status={status}
			data-mine={isMine || undefined}
			data-cy={MESSAGE_BUBBLE.ROOT}>
			<p
				className={cn(
					'm-0 max-w-[min(80%,34rem)] rounded-[1.125rem] px-[0.8125rem] py-[0.5625rem] text-[0.9375rem] leading-[1.45] wrap-anywhere whitespace-pre-line',
					isMine
						? 'rounded-br-[0.375rem] bg-accent text-on-accent'
						: 'rounded-bl-[0.375rem] border border-solid border-border-card bg-surface text-text',
					isSending && 'opacity-60',
					isFailed &&
						'border border-dashed border-danger bg-surface-sunken text-text',
				)}
				data-cy={MESSAGE_BUBBLE.TEXT}>
				<span className="sr-only">{hiddenPrefix}</span>
				{message}
			</p>
			{isSending && (
				<p
					className={META}
					data-cy={MESSAGE_BUBBLE.SENDING}>
					{MESSAGES_CONFIG.SENDING}
				</p>
			)}
			{isFailed && (
				<p className={cn(META, 'text-danger-text')}>
					<span
						role="alert"
						className="flex items-center gap-2"
						data-cy={MESSAGE_BUBBLE.FAILED}>
						{MESSAGES_CONFIG.NOT_SENT}
						<button
							type="button"
							className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-sans text-xs text-danger-text underline underline-offset-2"
							data-cy={MESSAGE_BUBBLE.TRY_AGAIN}
							onClick={() => onRetry?.()}>
							{MESSAGES_CONFIG.TRY_AGAIN}
						</button>
					</span>
				</p>
			)}
			{showTime && status === 'sent' && createdAt !== null && (
				<p className={META}>
					<time
						dateTime={new Date(createdAt).toISOString()}
						title={formatFullTime(createdAt)}
						data-cy={MESSAGE_BUBBLE.TIME}>
						{formatClockTime(createdAt)}
					</time>
				</p>
			)}
		</div>
	)
}

MessageBubble.propTypes = {
	message: PropTypes.string.isRequired,
	isMine: PropTypes.bool.isRequired,
	senderName: PropTypes.string.isRequired,
	createdAt: PropTypes.number,
	status: PropTypes.oneOf(['sent', 'sending', 'failed']),
	showTime: PropTypes.bool,
	onRetry: PropTypes.func,
	className: PropTypes.string,
}

export default MessageBubble
