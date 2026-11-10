import { cn } from '@/utils/cn'
import { MESSAGE_SKELETON } from '@/constants/test'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'

const MessageSkeleton = () => (
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

export default MessageSkeleton
