import PropTypes from 'prop-types'

import { TRAVELLERS_SKELETON } from '@/constants/test'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'
import { TRAVELLERS_GRID } from '@/constants/ui'

import FilterSkeleton from '@/components/travellers/filter-skeleton/FilterSkeleton'
import TravellerSkeleton from '@/components/travellers/traveller-skeleton/TravellerSkeleton'

const SKELETON_KEYS = Array.from(
	{ length: TRAVELLERS_LIST_CONFIG.PAGE_SIZE },
	(_, index) => index,
)

// Everything under the Travellers heading while the list loads, shared by the page and its route fallback so the two match
const TravellersSkeleton = ({ isPublic = false }) => (
	<div data-cy={TRAVELLERS_SKELETON.ROOT}>
		{/* Read out, not shown: a visible line here would go when the list arrives and pull the page up */}
		<p
			role="status"
			className="sr-only"
			data-cy={TRAVELLERS_SKELETON.LOADING}>
			{TRAVELLERS_LIST_CONFIG.LOADING_LABEL}
		</p>
		<FilterSkeleton />
		<ul
			aria-busy="true"
			className={TRAVELLERS_GRID}
			data-cy={TRAVELLERS_SKELETON.LIST}>
			{SKELETON_KEYS.map((key) => (
				<TravellerSkeleton
					key={key}
					isPublic={isPublic}
				/>
			))}
		</ul>
	</div>
)

TravellersSkeleton.propTypes = {
	isPublic: PropTypes.bool,
}

export default TravellersSkeleton
