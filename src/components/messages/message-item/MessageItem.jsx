import { useState } from 'react'
import PropTypes from 'prop-types'

import { MESSAGE_ITEM } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import { cn } from '@/utils/cn'
import { formatFullTime, formatMessageTime } from '@/utils/formatMessageTime'

import BaseButton from '@/components/ui/button/BaseButton'

const actionClasses = 'min-h-11 px-4 py-0 font-medium'
// Matches BaseButton's primary look, for the one action that is a mailto link rather than a route
const mailtoClasses =
	'inline-flex min-h-11 items-center justify-center rounded-pill border border-solid border-accent bg-accent px-4 font-medium text-on-accent no-underline hover:border-accent-hover hover:bg-accent-hover active:border-accent-hover active:bg-accent-hover'

const senderLabel = ({ senderStatus, senderName, userEmail }) => {
	if (senderStatus === SENDER_STATUS.LEGACY) return userEmail
	if (senderStatus === SENDER_STATUS.FORMER)
		return MESSAGES_CONFIG.FORMER_TRAVELLER
	return senderName || MESSAGES_CONFIG.UNKNOWN_TRAVELLER
}

const mailtoHref = (email, message) =>
	`mailto:${email}?${new URLSearchParams({
		subject: MESSAGES_CONFIG.REPLY_EMAIL_SUBJECT,
		body: `\n\n> ${message}`,
	})
		.toString()
		.replace(/\+/g, '%20')}`

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
	const canReply =
		senderStatus === SENDER_STATUS.TRAVELLER ||
		senderStatus === SENDER_STATUS.UNKNOWN
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
			<div className="mt-3 flex flex-wrap items-center gap-2">
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
						data-cy={MESSAGE_ITEM.REPLY}>
						{MESSAGES_CONFIG.REPLY}
					</BaseButton>
				)}
				{senderStatus === SENDER_STATUS.LEGACY && userEmail && (
					<a
						className={mailtoClasses}
						href={mailtoHref(userEmail, message)}
						data-cy={MESSAGE_ITEM.REPLY}>
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
					data-cy={MESSAGE_ITEM.DELETE}>
					{MESSAGES_CONFIG.DELETE}
				</BaseButton>
			</div>
			{deleteError && (
				<div
					role="alert"
					className="mt-3 flex flex-wrap items-center gap-2.5 rounded-sm border border-danger bg-danger-surface px-3 py-2.5 text-sm"
					data-cy={MESSAGE_ITEM.DELETE_ERROR}>
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
						data-cy={MESSAGE_ITEM.TRY_AGAIN}>
						{MESSAGES_CONFIG.TRY_AGAIN}
					</BaseButton>
				</div>
			)}
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
