import PropTypes from 'prop-types'

import { CONVERSATION_SKELETON } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'

import { cn } from '@/utils/cn'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'

const BUBBLES = [
	{ side: 'self-start', size: 'h-12 w-[60%]' },
	{ side: 'self-end', size: 'h-9 w-1/2' },
	{ side: 'self-start', size: 'h-16 w-[70%]' },
	{ side: 'self-end', size: 'h-9 w-2/5' },
]

const ListSkeleton = ({ count, className }) => (
	<ul
		aria-busy="true"
		className={cn('m-0 list-none divide-y divide-border p-0', className)}
		data-cy={CONVERSATION_SKELETON.LIST}>
		{Array.from({ length: count }, (_, index) => (
			<li
				key={index}
				aria-hidden="true"
				className="flex min-h-18 items-center gap-3 px-3.5 py-3"
				data-cy={CONVERSATION_SKELETON.ROW}>
				<span className={cn(BLOCK, 'size-10 shrink-0 rounded-full')} />
				<span className="flex min-w-0 flex-1 flex-col gap-2">
					<span className={cn(BLOCK, 'h-4 w-[55%]')} />
					<span className={cn(BLOCK, 'h-3 w-[85%]')} />
				</span>
			</li>
		))}
	</ul>
)

const ThreadSkeleton = ({ className }) => (
	<div
		aria-busy="true"
		className={cn('flex flex-col gap-1.5 p-3', className)}
		data-cy={CONVERSATION_SKELETON.THREAD}>
		{BUBBLES.map(({ side, size }) => (
			<span
				key={size}
				aria-hidden="true"
				className={cn(BLOCK, 'rounded-[1.125rem]', side, size)}
			/>
		))}
	</div>
)

const HeaderSkeleton = ({ className }) => (
	<div
		aria-hidden="true"
		className={cn(
			'flex min-h-15 items-center gap-2.5 border-0 border-b border-solid border-border px-3 py-2',
			className,
		)}
		data-cy={CONVERSATION_SKELETON.HEADER}>
		<span className={cn(BLOCK, 'size-8 shrink-0 rounded-full')} />
		<span className={cn(BLOCK, 'h-4 w-2/5')} />
	</div>
)

ListSkeleton.propTypes = {
	count: PropTypes.number.isRequired,
	className: PropTypes.string,
}

ThreadSkeleton.propTypes = { className: PropTypes.string }

HeaderSkeleton.propTypes = { className: PropTypes.string }

const VARIANTS = {
	list: ListSkeleton,
	thread: ThreadSkeleton,
	header: HeaderSkeleton,
}

function ConversationSkeleton({
	variant = 'list',
	count = MESSAGES_CONFIG.LIST_SKELETON_COUNT,
	className,
}) {
	const Skeleton = VARIANTS[variant]
	return (
		<Skeleton
			count={count}
			className={className}
		/>
	)
}

ConversationSkeleton.propTypes = {
	variant: PropTypes.oneOf(Object.keys(VARIANTS)),
	count: PropTypes.number,
	className: PropTypes.string,
}

export default ConversationSkeleton
