import classNames from 'classnames'
import PropTypes from 'prop-types'

import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import travellerFilterStyles from './TravellerFilter.module.scss'

const TravellerFilter = ({ options, inactiveIds = [], onChangeFilter }) => (
	<fieldset
		className={travellerFilterStyles.filter}
		data-cy={TRAVELLER_FILTER.ROOT}>
		<legend className={travellerFilterStyles.legend}>
			{TRAVELLER_FILTER_CONFIG.LEGEND}
		</legend>
		<div className={travellerFilterStyles.options}>
			{options.map(({ id, label }) => {
				const isActive = !inactiveIds.includes(id)

				return (
					<span
						key={id}
						className={travellerFilterStyles.option}
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
							className={classNames(travellerFilterStyles.label, {
								[travellerFilterStyles.active]: isActive,
							})}>
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
