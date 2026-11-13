import PropTypes from 'prop-types'

import { MESSAGE_PANE } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import { formatFullTime } from '@/utils/formatMessageTime'
import { senderLabel } from '@/utils/messageSender'

import MessageActions from '@/components/messages/message-actions/MessageActions'
import BaseButton from '@/components/ui/button/BaseButton'

const MessagePane = ({
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
	headingRef,
}) => {
	const sender = senderLabel({ senderStatus, senderName, userEmail })
	const headingId = `message-${id}-sender`

	return (
		<article
			aria-labelledby={headingId}
			className="flex flex-col gap-3.5 rounded-lg border border-border-card bg-surface p-4 text-left shadow-card"
			data-message-id={id}
			data-cy={MESSAGE_PANE.ROOT}>
			<div className="flex flex-wrap items-baseline gap-2">
				<h2
					id={headingId}
					ref={headingRef}
					tabIndex={-1}
					className="m-0 rounded-sm text-xl leading-snug font-bold wrap-anywhere"
					data-cy={MESSAGE_PANE.SENDER}>
					{senderStatus === SENDER_STATUS.TRAVELLER ? (
						<BaseButton
							isLink
							to={`${PATHS.TRAVELLERS}/${senderId}`}
							className="text-text-link underline underline-offset-4"
							data-cy={MESSAGE_PANE.SENDER_LINK}>
							{sender}
						</BaseButton>
					) : (
						sender
					)}
				</h2>
				{isNew && (
					<span
						className="text-xs font-medium tracking-[0.06em] text-accent-text uppercase"
						data-cy={MESSAGE_PANE.NEW_TAG}>
						{MESSAGES_CONFIG.NEW_TAG}
						<span className="sr-only">
							{MESSAGES_CONFIG.NEW_TAG_HIDDEN}
						</span>
					</span>
				)}
				{createdAt && (
					<time
						className="ml-auto text-[0.8125rem] whitespace-nowrap text-text-muted"
						dateTime={new Date(createdAt).toISOString()}
						data-cy={MESSAGE_PANE.TIME}>
						{formatFullTime(createdAt)}
					</time>
				)}
			</div>
			<p
				className="m-0 max-w-[70ch] wrap-anywhere whitespace-pre-line"
				data-cy={MESSAGE_PANE.TEXT}>
				{message}
			</p>
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
			/>
		</article>
	)
}

MessagePane.propTypes = {
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
	headingRef: PropTypes.oneOfType([
		PropTypes.func,
		PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
	]),
}

export default MessagePane
