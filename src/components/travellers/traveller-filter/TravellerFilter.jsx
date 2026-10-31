import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

const TravellerFilter = ({ options, inactiveIds = [], onChangeFilter }) => (
	<fieldset
		className="m-0 my-4 border-0 p-0"
		data-cy={TRAVELLER_FILTER.ROOT}>
		<legend className="my-2 p-0 text-2xl font-bold">
			{TRAVELLER_FILTER_CONFIG.LEGEND}
		</legend>
		<div className="flex flex-wrap">
			{options.map(({ id, label }) => {
				const isActive = !inactiveIds.includes(id)

				return (
					<span
						key={id}
						className="mr-4 [@media(max-width:440px)]:mr-0 [@media(max-width:440px)]:w-1/2"
						data-cy={TRAVELLER_FILTER.OPTION}>
						<input
							type="checkbox"
							id={`filter-${id}`}
							checked={isActive}
							onChange={(event) =>
								onChangeFilter(id, event.target.checked)
							}
							data-cy={TRAVELLER_FILTER.CHECKBOX}
						/>
						<label
							htmlFor={`filter-${id}`}
							className={cn(
								'select-none',
								isActive && 'font-bold',
							)}>
							{label}
						</label>
					</span>
				)
			})}
		</div>
	</fieldset>
)

TravellerFilter.propTypes = {
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		}),
	).isRequired,
	inactiveIds: PropTypes.arrayOf(PropTypes.string),
	onChangeFilter: PropTypes.func.isRequired,
}

export default TravellerFilter
