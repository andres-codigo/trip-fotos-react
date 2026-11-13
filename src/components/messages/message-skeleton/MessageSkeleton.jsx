import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { MESSAGE_SKELETON } from '@/constants/test'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'

const CardSkeleton = () => (
	<li
		aria-hidden="true"
		className="list-none rounded-lg border border-border-strong bg-surface p-4"
		data-cy={MESSAGE_SKELETON.ROOT}>
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className={cn(BLOCK, 'h-[18px] w-[46%]')} />
				<span className={cn(BLOCK, 'h-3.5 w-1/5')} />
			</div>
			<div className="flex flex-col gap-2">
				<span className={cn(BLOCK, 'h-3.5 w-full')} />
				<span className={cn(BLOCK, 'h-3.5 w-4/5')} />
			</div>
			<div className="flex items-center justify-between">
				<span className={cn(BLOCK, 'h-11 w-[84px] rounded-full')} />
				<span className={cn(BLOCK, 'h-11 w-[70px] rounded-full')} />
			</div>
		</div>
	</li>
)

const RowSkeleton = () => (
	<li
		aria-hidden="true"
		className="min-h-11 px-[18px] py-3.5"
		data-cy={MESSAGE_SKELETON.ROW}>
		<div className="flex items-center">
			<span className={cn(BLOCK, 'h-4 w-[55%]')} />
			<span className={cn(BLOCK, 'ml-auto h-3 w-[22%]')} />
		</div>
		<span className={cn(BLOCK, 'mt-2 h-3 w-[90%]')} />
	</li>
)

const PaneSkeleton = () => (
	<div
		aria-hidden="true"
		className="flex flex-col gap-3.5 rounded-lg border border-border-card bg-surface p-4 shadow-card"
		data-cy={MESSAGE_SKELETON.PANE}>
		<div className="flex items-center">
			<span className={cn(BLOCK, 'h-[22px] w-2/5')} />
			<span className={cn(BLOCK, 'ml-auto h-3.5 w-[24%]')} />
		</div>
		<div>
			<span className={cn(BLOCK, 'h-3.5 w-full')} />
			<span className={cn(BLOCK, 'mt-2.5 h-3.5 w-[96%]')} />
			<span className={cn(BLOCK, 'mt-2.5 h-3.5 w-[88%]')} />
			<span className={cn(BLOCK, 'mt-2.5 h-3.5 w-3/5')} />
		</div>
		<div className="flex items-center gap-2">
			<span className={cn(BLOCK, 'h-11 w-[84px] rounded-full')} />
			<span className="flex-1" />
			<span className={cn(BLOCK, 'h-11 w-[70px] rounded-full')} />
		</div>
	</div>
)

const VARIANTS = { card: CardSkeleton, row: RowSkeleton, pane: PaneSkeleton }

const MessageSkeleton = ({ variant = 'card' }) => {
	const Skeleton = VARIANTS[variant]
	return <Skeleton />
}

MessageSkeleton.propTypes = {
	variant: PropTypes.oneOf(Object.keys(VARIANTS)),
}

export default MessageSkeleton
