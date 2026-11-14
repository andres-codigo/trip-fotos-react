import { cn } from '@/utils/cn'
import { FILTER_SKELETON } from '@/constants/test'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'
const CHIP_WIDTHS = ['w-24', 'w-32', 'w-20', 'w-28', 'w-24']

// TravellerFilter's two forms at their own sizes: the inline fieldset from 769px, the sheet trigger bar at 768px and below. The inline one has the city search, which shows once there are more than a few cities, as there are on a live list
const FilterSkeleton = () => (
	<div
		aria-hidden="true"
		data-cy={FILTER_SKELETON.ROOT}>
		<div
			className="my-4 mobile:hidden"
			data-cy={FILTER_SKELETON.INLINE}>
			<div className="flex items-center justify-between gap-x-3">
				<span className="my-2 flex h-7.5 items-center">
					<span className={cn(BLOCK, 'h-5 w-36')} />
				</span>
				<span className="flex h-11 items-center px-2.5">
					<span className={cn(BLOCK, 'h-4 w-16')} />
				</span>
			</div>
			<div
				className="mb-2 w-70"
				data-cy={FILTER_SKELETON.SEARCH}>
				<span className="mb-2 flex h-lh items-center">
					<span className={cn(BLOCK, 'h-3.5 w-24')} />
				</span>
				<span
					className={cn(BLOCK, 'h-[2.375rem] w-full rounded-none')}
				/>
			</div>
			<div className="flex flex-wrap gap-2 p-1.5">
				{CHIP_WIDTHS.map((width, index) => (
					<span
						key={index}
						className={cn(BLOCK, 'h-11 rounded-pill', width)}
					/>
				))}
			</div>
			<span className="mt-2 flex h-5 items-center">
				<span className={cn(BLOCK, 'h-3 w-40')} />
			</span>
		</div>
		<span
			className={cn(
				BLOCK,
				'my-4 hidden h-11 w-full rounded-md mobile:block',
			)}
			data-cy={FILTER_SKELETON.TRIGGER}
		/>
	</div>
)

export default FilterSkeleton
