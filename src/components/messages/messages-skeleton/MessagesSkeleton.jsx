import PropTypes from 'prop-types'

import { MESSAGES_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { MESSAGES_LAYOUT } from '@/constants/ui'

import MessageSkeleton from '@/components/messages/message-skeleton/MessageSkeleton'

const keys = (length) => Array.from({ length }, (_, index) => index)

// The Messages lists while they load, shared by the page and its route fallback: the inbox's rows and open pane from 1024px, cards below
const MessagesSkeleton = ({ isInbox = false }) =>
	isInbox ? (
		<>
			<ul
				aria-busy="true"
				className={MESSAGES_LAYOUT.INBOX_LIST}
				data-cy={MESSAGES_SKELETON.ROOT}>
				{keys(MESSAGES_CONFIG.INBOX_SKELETON_COUNT).map((key) => (
					<MessageSkeleton
						key={key}
						variant="row"
					/>
				))}
			</ul>
			<MessageSkeleton variant="pane" />
		</>
	) : (
		<ul
			aria-busy="true"
			className={MESSAGES_LAYOUT.CARD_LIST}
			data-cy={MESSAGES_SKELETON.ROOT}>
			{keys(MESSAGES_CONFIG.SKELETON_COUNT).map((key) => (
				<MessageSkeleton key={key} />
			))}
		</ul>
	)

MessagesSkeleton.propTypes = {
	isInbox: PropTypes.bool,
}

export default MessagesSkeleton
