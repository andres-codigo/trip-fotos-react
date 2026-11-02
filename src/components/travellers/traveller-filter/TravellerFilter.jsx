import { useState } from 'react'

import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'

const TravellerFilter = ({
	options,
	inactiveIds = [],
	onChangeFilter,
	onChangeMany,
}) => {
	const [query, setQuery] = useState('')

	const hasSearch = options.length > TRAVELLER_FILTER_CONFIG.SEARCH_THRESHOLD
	const term = hasSearch ? query.trim().toLowerCase() : ''
	const visible = term
		? options.filter(({ label }) => label.toLowerCase().includes(term))
		: options
	const selectedCount = options.filter(
		({ id }) => !inactiveIds.includes(id),
	).length
	const visibleIds = visible.map(({ id }) => id)

	return (
		<fieldset
			className="m-0 my-4 border-0 p-0"
			data-cy={TRAVELLER_FILTER.ROOT}>
			<legend className="my-2 p-0 text-2xl leading-normal font-bold">
				{TRAVELLER_FILTER_CONFIG.LEGEND}
			</legend>
			<div className="mb-2 flex flex-wrap items-end gap-2">
				{hasSearch && (
					<Input
						id="filter-search"
						label={TRAVELLER_FILTER_CONFIG.SEARCH_LABEL}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						data-cy={TRAVELLER_FILTER.SEARCH}
					/>
				)}
				<BaseButton
					type="button"
					modeType="outline"
					onClick={() => onChangeMany(visibleIds, true)}
					data-cy={TRAVELLER_FILTER.SELECT_ALL}>
					{TRAVELLER_FILTER_CONFIG.SELECT_ALL}
				</BaseButton>
				<BaseButton
					type="button"
					modeType="outline"
					onClick={() => onChangeMany(visibleIds, false)}
					data-cy={TRAVELLER_FILTER.CLEAR}>
					{TRAVELLER_FILTER_CONFIG.CLEAR}
				</BaseButton>
			</div>
			{/* Scrollable regions must be keyboard-focusable */}
			<div
				className="flex max-h-48 flex-wrap overflow-y-auto"
				role="group"
				aria-label={TRAVELLER_FILTER_CONFIG.LIST_LABEL}
				tabIndex={0}
				data-cy={TRAVELLER_FILTER.LIST}>
				{visible.map(({ id, label }) => {
					const isActive = !inactiveIds.includes(id)

					return (
						<span
							key={id}
							className="mr-4 max-sm:mr-0 max-sm:w-1/2"
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
				{visible.length === 0 && (
					<p
						className="m-0"
						data-cy={TRAVELLER_FILTER.EMPTY}>
						{TRAVELLER_FILTER_CONFIG.NO_MATCH}
					</p>
				)}
			</div>
			<p
				className="mt-2 mb-0 text-sm"
				aria-live="polite"
				data-cy={TRAVELLER_FILTER.STATUS}>
				{`${selectedCount} of ${options.length} cities selected`}
			</p>
		</fieldset>
	)
}

TravellerFilter.propTypes = {
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		}),
	).isRequired,
	inactiveIds: PropTypes.arrayOf(PropTypes.string),
	onChangeFilter: PropTypes.func.isRequired,
	onChangeMany: PropTypes.func.isRequired,
}

export default TravellerFilter
