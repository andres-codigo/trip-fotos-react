import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { MESSAGE_ROW } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import { cn } from '@/utils/cn'
import { formatFullTime, formatMessageTime } from '@/utils/formatMessageTime'
import { senderLabel } from '@/utils/messageSender'

const MessageRow = ({
	id,
	senderStatus,
	senderName = null,
	userEmail = null,
	message,
	createdAt = null,
	isNew = false,
	isOpen = false,
	onSelect,
}) => {
	const sender = senderLabel({ senderStatus, senderName, userEmail })

	// The Link's push navigation is the selection, so onClick never prevents it; the list clips overflow, so the focus ring sits inside the row
	return (
		<li
			data-message-id={id}
			data-cy={MESSAGE_ROW.ROOT}>
			<Link
				to={`?${MESSAGES_CONFIG.MESSAGE_PARAM}=${id}`}
				aria-current={isOpen ? 'true' : undefined}
				data-open={isOpen || undefined}
				data-new={isNew || undefined}
				onClick={() => onSelect(id)}
				className={cn(
					'relative flex min-h-11 flex-col gap-1 px-[18px] py-3.5 text-text hover:bg-surface-sunken focus-visible:-outline-offset-3',
					isOpen &&
						'bg-surface-accent before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-[3px] before:rounded-r-[3px] before:bg-accent-text hover:bg-surface-accent',
				)}
				data-cy={MESSAGE_ROW.LINK}>
				<span className="flex min-w-0 items-center gap-2">
					{isNew && (
						<span
							aria-hidden="true"
							className="size-2.5 shrink-0 rounded-full bg-accent"
							data-cy={MESSAGE_ROW.DOT}
						/>
					)}
					<span
						className={cn(
							'min-w-0 flex-1 truncate text-[0.9375rem] font-medium',
							isNew && 'font-bold',
						)}
						data-cy={MESSAGE_ROW.SENDER}>
						{sender}
						{isNew && (
							<span className="sr-only">
								{MESSAGES_CONFIG.NEW_ROW_HIDDEN}
							</span>
						)}
					</span>
					{createdAt && (
						<time
							className="ml-auto text-[0.8125rem] whitespace-nowrap text-text-muted"
							dateTime={new Date(createdAt).toISOString()}
							title={formatFullTime(createdAt)}
							data-cy={MESSAGE_ROW.TIME}>
							{formatMessageTime(createdAt)}
						</time>
					)}
				</span>
				<span
					className="truncate text-sm text-text-muted"
					data-cy={MESSAGE_ROW.PREVIEW}>
					{message}
				</span>
			</Link>
		</li>
	)
}

MessageRow.propTypes = {
	id: PropTypes.string.isRequired,
	senderStatus: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	senderName: PropTypes.string,
	userEmail: PropTypes.string,
	message: PropTypes.string.isRequired,
	createdAt: PropTypes.number,
	isNew: PropTypes.bool,
	isOpen: PropTypes.bool,
	onSelect: PropTypes.func.isRequired,
}

export default MessageRow
