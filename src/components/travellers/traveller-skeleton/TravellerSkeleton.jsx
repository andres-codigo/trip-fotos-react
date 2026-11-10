import { cn } from '@/utils/cn'
import { TRAVELLER_SKELETON } from '@/constants/test'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'

const TravellerSkeleton = () => (
	<li
		aria-hidden="true"
		className="my-4 list-none rounded-lg border border-border-strong p-4"
		data-cy={TRAVELLER_SKELETON.ROOT}>
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<span className={cn(BLOCK, 'size-11 shrink-0 rounded-full')} />
				<div className="flex flex-1 flex-col gap-2">
					<span className={cn(BLOCK, 'h-[18px] w-3/5')} />
					<span className={cn(BLOCK, 'h-3 w-[35%]')} />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<span className={cn(BLOCK, 'h-3 w-full')} />
				<span className={cn(BLOCK, 'h-3 w-4/5')} />
			</div>
			<div className="flex gap-2">
				<span className={cn(BLOCK, 'h-6 w-24 rounded-full')} />
				<span className={cn(BLOCK, 'h-6 w-24 rounded-full')} />
			</div>
			<div className="flex gap-2">
				{[0, 1, 2].map((tile) => (
					<span
						key={tile}
						className={cn(
							BLOCK,
							'aspect-square max-w-[88px] flex-1 rounded-xl',
						)}
					/>
				))}
			</div>
		</div>
	</li>
)

export default TravellerSkeleton
