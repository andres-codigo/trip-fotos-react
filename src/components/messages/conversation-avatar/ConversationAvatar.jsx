import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import { CONVERSATION_AVATAR } from '@/constants/test'
import { SENDER_STATUS } from '@/constants/travellers'

import InitialsAvatar from '@/components/ui/avatar/InitialsAvatar'
import { cn } from '@/utils/cn'

const avatarVariants = cva('', {
	variants: {
		size: {
			md: 'size-10 text-[0.9375rem]',
			sm: 'size-8 text-[0.8125rem]',
		},
	},
	defaultVariants: { size: 'md' },
})

const PLACEHOLDER = {
	[SENDER_STATUS.FORMER]: '?',
	[SENDER_STATUS.UNKNOWN]: '?',
	[SENDER_STATUS.LEGACY]: '@',
}

// Decorative: the name it stands for is always shown beside it
function ConversationAvatar({ name, status, size = 'md', className }) {
	return (
		<span
			aria-hidden="true"
			data-cy={CONVERSATION_AVATAR.ROOT}
			data-status={status}
			className={cn('flex shrink-0', className)}>
			{status === SENDER_STATUS.TRAVELLER ? (
				<InitialsAvatar
					name={name}
					className={avatarVariants({ size })}
				/>
			) : (
				<span
					className={cn(
						'flex shrink-0 items-center justify-center rounded-full border border-solid border-border-card bg-surface-sunken leading-none font-bold text-text-muted select-none',
						avatarVariants({ size }),
					)}>
					{PLACEHOLDER[status]}
				</span>
			)}
		</span>
	)
}

ConversationAvatar.propTypes = {
	name: PropTypes.string.isRequired,
	status: PropTypes.oneOf(Object.values(SENDER_STATUS)).isRequired,
	size: PropTypes.oneOf(['md', 'sm']),
	className: PropTypes.string,
}

export default ConversationAvatar
