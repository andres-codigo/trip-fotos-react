import { Fragment, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { MESSAGE_THREAD } from '@/constants/test'
import { MESSAGES_CONFIG, SENDER_STATUS } from '@/constants/travellers'

import ConversationAvatar from '@/components/messages/conversation-avatar/ConversationAvatar'
import ConversationSkeleton from '@/components/messages/conversation-skeleton/ConversationSkeleton'
import MessageBubble from '@/components/messages/message-bubble/MessageBubble'
import { cn } from '@/utils/cn'
import { formatDayLabel } from '@/utils/formatMessageTime'

const dayKey = (time) => new Date(time).toDateString()

function MessageThread({
	messages,
	userId,
	otherName,
	newFromId = null,
	isLoading = false,
	canSayHello = true,
	onRetry,
	label,
	className,
}) {
	const scrollerRef = useRef(null)
	const dividerRef = useRef(null)
	const lastIdRef = useRef(null)

	const lastId = messages.at(-1)?.id ?? null
	// The last bubble's status line ("Sending…", "Not sent. Try again") changes its height, so it scrolls into view too
	const lastKey = lastId && `${lastId}:${messages.at(-1).status}`

	useLayoutEffect(() => {
		const scroller = scrollerRef.current
		if (isLoading || !scroller || lastKey === null) return

		const isFirst = lastIdRef.current === null
		if (lastKey === lastIdRef.current) return
		lastIdRef.current = lastKey

		if (isFirst && dividerRef.current) {
			dividerRef.current.scrollIntoView({ block: 'start' })
			return
		}
		scroller.scrollTop = scroller.scrollHeight
	}, [isLoading, lastKey])

	const isEmpty = !isLoading && canSayHello && messages.length === 0

	return (
		<section
			ref={scrollerRef}
			aria-label={label}
			aria-busy={isLoading || undefined}
			tabIndex={0}
			className={cn(
				'flex flex-col overflow-y-auto p-3 focus-visible:-outline-offset-3',
				className,
			)}
			data-cy={MESSAGE_THREAD.ROOT}>
			{/* mt-auto, not justify-end: justify-end makes overflow unreachable above the top */}
			<div className="mt-auto flex flex-col gap-1.5">
				{isLoading && (
					<ConversationSkeleton
						variant="thread"
						className="p-0"
					/>
				)}
				{isEmpty && (
					<div
						className="flex flex-col items-center gap-3 px-4 py-8 text-center"
						data-cy={MESSAGE_THREAD.HELLO}>
						<ConversationAvatar
							name={otherName}
							status={SENDER_STATUS.TRAVELLER}
						/>
						<p className="m-0 max-w-80 text-[0.9375rem] text-text-muted">
							{MESSAGES_CONFIG.SAY_HELLO(otherName)}
						</p>
					</div>
				)}
				{!isLoading &&
					messages.map((item, index) => {
						const previous = messages[index - 1]
						const next = messages[index + 1]
						const isNewDay =
							item.createdAt !== null &&
							(!previous ||
								dayKey(previous.createdAt) !==
									dayKey(item.createdAt))
						const endsRun =
							!next ||
							next.senderId !== item.senderId ||
							dayKey(next.createdAt) !== dayKey(item.createdAt)
						const isMine = item.senderId === userId

						return (
							<Fragment key={item.id}>
								{isNewDay && (
									<p
										className="m-0 py-2 text-center text-xs font-medium tracking-[.04em] text-text-muted"
										data-cy={MESSAGE_THREAD.DAY}>
										{formatDayLabel(item.createdAt)}
									</p>
								)}
								{item.id === newFromId && (
									<p
										ref={dividerRef}
										className="m-0 flex items-center gap-3 py-2 text-xs font-medium text-accent-text uppercase before:h-px before:flex-1 before:bg-accent-text before:opacity-60 after:h-px after:flex-1 after:bg-accent-text after:opacity-60"
										data-cy={MESSAGE_THREAD.NEW_DIVIDER}>
										{MESSAGES_CONFIG.NEW_DIVIDER}
									</p>
								)}
								<MessageBubble
									message={item.message}
									isMine={isMine}
									senderName={otherName}
									createdAt={item.createdAt}
									status={item.status}
									showTime={endsRun}
									onRetry={() => onRetry?.(item.id)}
								/>
							</Fragment>
						)
					})}
			</div>
		</section>
	)
}

MessageThread.propTypes = {
	messages: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			senderId: PropTypes.string,
			message: PropTypes.string.isRequired,
			createdAt: PropTypes.number,
			status: PropTypes.oneOf(['sent', 'sending', 'failed']),
		}),
	).isRequired,
	userId: PropTypes.string.isRequired,
	otherName: PropTypes.string.isRequired,
	newFromId: PropTypes.string,
	isLoading: PropTypes.bool,
	// False when the thread failed to load, so an error is not taken for an empty conversation
	canSayHello: PropTypes.bool,
	onRetry: PropTypes.func,
	label: PropTypes.string.isRequired,
	className: PropTypes.string,
}

export default MessageThread
