import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { CONVERSATION_ROW } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import ConversationAvatar from '@/components/messages/conversation-avatar/ConversationAvatar'
import { cn } from '@/utils/cn'
import { formatFullTime, formatMessageTime } from '@/utils/formatMessageTime'

function ConversationRow({
	id,
	to,
	name,
	status,
	lastMessage,
	lastAt = null,
	isLastMine = false,
	isUnread = false,
	isOpen = false,
	onSelect,
}) {
	// The list clips overflow, so the focus ring sits inside the row
	return (
		<li
			data-conversation-id={id}
			data-cy={CONVERSATION_ROW.ROOT}>
			<Link
				to={to}
				aria-current={isOpen ? 'true' : undefined}
				data-open={isOpen || undefined}
				data-unread={isUnread || undefined}
				onClick={() => onSelect?.(id)}
				className={cn(
					'relative flex min-h-18 items-center gap-3 px-3.5 py-3 text-text hover:bg-surface-sunken focus-visible:-outline-offset-3',
					isOpen &&
						'bg-surface-accent before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-[3px] before:rounded-r-[3px] before:bg-accent-text hover:bg-surface-accent',
				)}
				data-cy={CONVERSATION_ROW.LINK}>
				<ConversationAvatar
					name={name}
					status={status}
				/>
				<span className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="flex min-w-0 items-baseline gap-2">
						<span
							className={cn(
								'min-w-0 flex-1 truncate text-[0.9375rem] font-medium',
								isUnread && 'font-bold',
							)}
							data-cy={CONVERSATION_ROW.NAME}>
							{name}
							{isUnread && (
								<span className="sr-only">
									{MESSAGES_CONFIG.NEW_ROW_HIDDEN}
								</span>
							)}
						</span>
						{lastAt !== null && (
							<time
								className={cn(
									'shrink-0 text-[0.8125rem] whitespace-nowrap text-text-muted',
									isUnread && 'font-medium text-accent-text',
								)}
								dateTime={new Date(lastAt).toISOString()}
								title={formatFullTime(lastAt)}
								data-cy={CONVERSATION_ROW.TIME}>
								{formatMessageTime(lastAt)}
							</time>
						)}
					</span>
					<span className="flex min-w-0 items-center gap-2">
						<span
							className={cn(
								'min-w-0 flex-1 truncate text-sm text-text-muted',
								isUnread && 'text-text',
							)}
							data-cy={CONVERSATION_ROW.PREVIEW}>
							{isLastMine && MESSAGES_CONFIG.YOU_PREFIX}
							{lastMessage}
						</span>
						{isUnread && (
							<span
								aria-hidden="true"
								className="size-2.5 shrink-0 rounded-full bg-accent"
								data-cy={CONVERSATION_ROW.DOT}
							/>
						)}
					</span>
				</span>
			</Link>
		</li>
	)
}

ConversationRow.propTypes = {
	id: PropTypes.string.isRequired,
	to: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	status: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	lastMessage: PropTypes.string.isRequired,
	lastAt: PropTypes.number,
	isLastMine: PropTypes.bool,
	isUnread: PropTypes.bool,
	isOpen: PropTypes.bool,
	onSelect: PropTypes.func,
}

export default ConversationRow
