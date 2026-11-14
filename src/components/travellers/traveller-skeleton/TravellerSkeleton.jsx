import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { TRAVELLER_SKELETON } from '@/constants/test'
import { CARD_PHOTOS } from '@/constants/ui'

const BLOCK = 'block animate-skeleton rounded-lg bg-skeleton'
const PHOTO_KEYS = [0, 1, 2]

// A bar centred in one line of text, so the stand-in is as tall as the text it replaces
const Line = ({ className }) => (
	<span className="flex h-lh items-center">
		<span className={cn(BLOCK, 'h-3.5', className)} />
	</span>
)

Line.propTypes = {
	className: PropTypes.string,
}

// Each card's stand-in has the card's own parts, gaps and photo strip, so the grid does not move when the cards arrive
const TravellerSkeleton = ({ isPublic = false }) => (
	<li
		aria-hidden="true"
		className="traveller-card"
		data-cy={TRAVELLER_SKELETON.ROOT}>
		{/* The card head: avatar, then the name and the trip line */}
		<div className="flex items-start gap-3">
			<span className={cn(BLOCK, 'size-10 shrink-0 rounded-full')} />
			<div className="flex flex-1 flex-col gap-1">
				<span className="flex h-[1.425rem] items-center">
					<span className={cn(BLOCK, 'h-4.5 w-3/5')} />
				</span>
				<span className="flex h-5 items-center">
					<span className={cn(BLOCK, 'h-3 w-2/5')} />
				</span>
			</div>
		</div>
		{/* The signed-in description runs to its 250-character cap; the public excerpt is clamped to two lines */}
		<div
			className="mt-3.5 mb-3"
			data-cy={TRAVELLER_SKELETON.TEXT}>
			{isPublic ? (
				<>
					<Line className="w-full" />
					<Line className="w-3/4" />
				</>
			) : (
				<>
					<Line className="w-full" />
					<Line className="w-full" />
					<Line className="w-full" />
					<Line className="w-11/12" />
					<Line className="w-1/3" />
				</>
			)}
		</div>
		<div className="flex flex-wrap gap-2">
			<span
				className={cn(BLOCK, 'h-[calc(1lh+1rem)] w-28 rounded-pill')}
			/>
		</div>
		<div className="mt-auto flex flex-col pt-3.5">
			<ul
				className={
					isPublic ? CARD_PHOTOS.PUBLIC_LIST : CARD_PHOTOS.LIST
				}
				data-cy={TRAVELLER_SKELETON.PHOTOS}>
				{PHOTO_KEYS.map((key) => (
					<li
						key={key}
						className={cn(
							BLOCK,
							'aspect-square rounded-none',
							CARD_PHOTOS.TILE_WIDTH,
						)}
					/>
				))}
			</ul>
			{/* View trip, the one action every card has, sized as a button with its border */}
			<div className="flex justify-end">
				<span
					className={cn(BLOCK, 'h-[2.875rem] w-30 rounded-pill')}
					data-cy={TRAVELLER_SKELETON.BUTTON}
				/>
			</div>
		</div>
	</li>
)

TravellerSkeleton.propTypes = {
	isPublic: PropTypes.bool,
}

export default TravellerSkeleton
