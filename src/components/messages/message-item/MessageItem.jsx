import { useState } from 'react'
import PropTypes from 'prop-types'

import { MESSAGE_ITEM } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'
import { formatFullTime, formatMessageTime } from '@/utils/formatMessageTime'
import { senderLabel } from '@/utils/messageSender'

import MessageActions from '@/components/messages/message-actions/MessageActions'
import BaseButton from '@/components/ui/button/BaseButton'

const MessageItem = ({
	id,
	senderId = null,
	senderName = null,
	senderStatus,
	userEmail = null,
	message,
	createdAt = null,
	isNew = false,
	deleteError = null,
	isRetrying = false,
	onDelete,
	onRetry,
}) => {
	const [isExpanded, setIsExpanded] = useState(false)

	const sender = senderLabel({ senderStatus, senderName, userEmail })
	const hasCard = senderStatus === SENDER_STATUS.TRAVELLER
	const isLong = message.length > MESSAGES_CONFIG.CLAMP_LENGTH
	const when = createdAt ? formatMessageTime(createdAt) : null

	return (
		<li
			className={cn(
				'list-none rounded-lg border border-border-strong bg-surface p-4 text-left',
				isNew && 'border-accent-text bg-surface-accent',
			)}
			data-message-id={id}
			data-new={isNew || undefined}
			data-cy={MESSAGE_ITEM.ROOT}>
			<div className="flex flex-wrap items-baseline gap-2">
				{isNew && (
					<span
						aria-hidden="true"
						className="size-2.5 shrink-0 self-center rounded-full bg-accent"
					/>
				)}
				<h2
					className="m-0 text-[1.0625rem] leading-snug font-bold wrap-anywhere"
					data-cy={MESSAGE_ITEM.SENDER}>
					{hasCard ? (
						<BaseButton
							isLink
							to={`${PATHS.TRAVELLERS}/${senderId}`}
							className="text-text-link underline underline-offset-4"
							data-cy={MESSAGE_ITEM.SENDER_LINK}>
							{sender}
						</BaseButton>
					) : (
						sender
					)}
				</h2>
				{isNew && (
					<span
						className="text-xs font-medium tracking-[0.06em] text-accent-text uppercase"
						data-cy={MESSAGE_ITEM.NEW_TAG}>
						{MESSAGES_CONFIG.NEW_TAG}
						<span className="sr-only">
							{MESSAGES_CONFIG.NEW_TAG_HIDDEN}
						</span>
					</span>
				)}
				{when && (
					<time
						className="ml-auto text-[0.8125rem] whitespace-nowrap text-text-muted"
						dateTime={new Date(createdAt).toISOString()}
						title={formatFullTime(createdAt)}
						data-cy={MESSAGE_ITEM.TIME}>
						{when}
					</time>
				)}
			</div>
			<p
				id={`message-${id}-text`}
				className={cn(
					'mt-2.5 mb-0 wrap-anywhere whitespace-pre-line',
					isLong && !isExpanded && 'line-clamp-5',
				)}
				data-cy={MESSAGE_ITEM.TEXT}>
				{message}
			</p>
			{isLong && (
				<button
					type="button"
					className="inline-flex min-h-11 cursor-pointer items-center border-none bg-transparent p-0 text-sm text-text-link underline underline-offset-4"
					aria-expanded={isExpanded}
					aria-controls={`message-${id}-text`}
					onClick={() => setIsExpanded((value) => !value)}
					data-cy={MESSAGE_ITEM.SHOW_ALL}>
					{isExpanded
						? MESSAGES_CONFIG.SHOW_LESS
						: MESSAGES_CONFIG.SHOW_ALL}
				</button>
			)}
			<MessageActions
				id={id}
				senderId={senderId}
				senderName={senderName}
				senderStatus={senderStatus}
				userEmail={userEmail}
				message={message}
				createdAt={createdAt}
				sender={sender}
				deleteError={deleteError}
				isRetrying={isRetrying}
				onDelete={onDelete}
				onRetry={onRetry}
				className="mt-3"
			/>
		</li>
	)
}

MessageItem.propTypes = {
	id: PropTypes.string.isRequired,
	senderId: PropTypes.string,
	senderName: PropTypes.string,
	senderStatus: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	userEmail: PropTypes.string,
	message: PropTypes.string.isRequired,
	createdAt: PropTypes.number,
	isNew: PropTypes.bool,
	deleteError: PropTypes.string,
	isRetrying: PropTypes.bool,
	onDelete: PropTypes.func.isRequired,
	onRetry: PropTypes.func.isRequired,
}

export default MessageItem
