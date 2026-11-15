import PropTypes from 'prop-types'

import { CONVERSATION_LIST } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import ConversationRow from '@/components/messages/conversation-row/ConversationRow'
import { cn } from '@/utils/cn'

function ConversationList({
	conversations,
	openId = null,
	label,
	onSelect,
	className,
}) {
	return (
		<ul
			aria-label={label}
			className={cn(
				'm-0 list-none divide-y divide-border p-0',
				className,
			)}
			data-cy={CONVERSATION_LIST.ROOT}>
			{conversations.map((conversation) => (
				<ConversationRow
					key={conversation.id}
					{...conversation}
					isOpen={conversation.id === openId}
					onSelect={onSelect}
				/>
			))}
		</ul>
	)
}

ConversationList.propTypes = {
	conversations: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			to: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			status: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
			lastMessage: PropTypes.string.isRequired,
			lastAt: PropTypes.number,
			isLastMine: PropTypes.bool,
			isUnread: PropTypes.bool,
		}),
	).isRequired,
	openId: PropTypes.string,
	label: PropTypes.string.isRequired,
	onSelect: PropTypes.func,
	className: PropTypes.string,
}

export default ConversationList
