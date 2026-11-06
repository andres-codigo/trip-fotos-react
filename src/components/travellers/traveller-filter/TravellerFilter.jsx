import { useState } from 'react'

import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'

const LEGEND_ID = 'traveller-filter-legend'

// Link-styled, with a 44px target
const LINK_BUTTON_CLASSES =
	'min-h-11 px-2.5 text-accent-foreground underline hover:text-link-hover active:text-link-hover'

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
			aria-labelledby={LEGEND_ID}
			data-cy={TRAVELLER_FILTER.ROOT}>
			{/* A heading rather than a legend: a legend cannot share a flex row with the buttons, so the fieldset takes its name from aria-labelledby */}
			<div className="flex flex-wrap items-center justify-between gap-x-3">
				<h2
					id={LEGEND_ID}
					className="my-2 text-xl leading-normal font-bold">
					{TRAVELLER_FILTER_CONFIG.LEGEND}
				</h2>
				<div className="flex items-center">
					<BaseButton
						type="button"
						modeType="text"
						className={LINK_BUTTON_CLASSES}
						onClick={() => onChangeMany(visibleIds, true)}
						data-cy={TRAVELLER_FILTER.SELECT_ALL}>
						{TRAVELLER_FILTER_CONFIG.SELECT_ALL}
					</BaseButton>
					<BaseButton
						type="button"
						modeType="text"
						className={LINK_BUTTON_CLASSES}
						onClick={() => onChangeMany(visibleIds, false)}
						data-cy={TRAVELLER_FILTER.CLEAR}>
						{TRAVELLER_FILTER_CONFIG.CLEAR}
					</BaseButton>
				</div>
			</div>
			{hasSearch && (
				<div className="mb-2 w-70 mobile:w-full">
					<Input
						id="filter-search"
						label={TRAVELLER_FILTER_CONFIG.SEARCH_LABEL}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						data-cy={TRAVELLER_FILTER.SEARCH}
					/>
				</div>
			)}
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
