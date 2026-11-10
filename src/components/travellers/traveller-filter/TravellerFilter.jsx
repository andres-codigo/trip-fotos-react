import { useState } from 'react'

import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import BaseSheet from '@/components/ui/sheet/BaseSheet'

const LEGEND_ID = 'traveller-filter-legend'

// Link-styled, with a 44px target; aria-disabled rather than disabled, so focus stays on it after a reset
const LINK_BUTTON_CLASSES =
	'min-h-11 px-2.5 text-accent-text underline hover:text-accent-hover active:text-accent-hover aria-disabled:cursor-default aria-disabled:text-text-muted aria-disabled:no-underline'

const FilterIcon = () => (
	<svg
		aria-hidden="true"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round">
		<path d="M4 6h16M7 12h10M10 18h4" />
	</svg>
)

const TickIcon = () => (
	<svg
		aria-hidden="true"
		width="11"
		height="11"
		viewBox="0 0 12 12">
		<path
			d="M2.5 6.2 5 8.6l4.5-5"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
)

const ShowAllButton = ({ isFiltered, onShowAll }) => (
	<BaseButton
		type="button"
		modeType="text"
		className={LINK_BUTTON_CLASSES}
		aria-disabled={!isFiltered}
		onClick={() => isFiltered && onShowAll()}
		data-cy={TRAVELLER_FILTER.SHOW_ALL}>
		{TRAVELLER_FILTER_CONFIG.SHOW_ALL}
	</BaseButton>
)

ShowAllButton.propTypes = {
	isFiltered: PropTypes.bool.isRequired,
	onShowAll: PropTypes.func.isRequired,
}

const CityChoices = ({ idPrefix, options, selectedIds, onToggle, inSheet }) => {
	const [query, setQuery] = useState('')

	const hasSearch = options.length > TRAVELLER_FILTER_CONFIG.SEARCH_THRESHOLD
	const term = hasSearch ? query.trim().toLowerCase() : ''
	const visible = term
		? options.filter(({ label }) => label.toLowerCase().includes(term))
		: options

	return (
		<>
			{hasSearch && (
				<div className="mb-2 w-70 mobile:w-full">
					<Input
						id={`${idPrefix}-search`}
						label={TRAVELLER_FILTER_CONFIG.SEARCH_LABEL}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						data-cy={TRAVELLER_FILTER.SEARCH}
					/>
				</div>
			)}
			{/* Scrollable regions must be keyboard-focusable; the padding fits a chip's 5px focus ring inside the scroll clip */}
			<div
				className={cn(
					'flex flex-wrap content-start gap-2 overflow-y-auto p-1.5',
					!inSheet && 'max-h-48',
				)}
				role="group"
				aria-label={TRAVELLER_FILTER_CONFIG.LIST_LABEL}
				tabIndex={0}
				data-cy={TRAVELLER_FILTER.LIST}>
				{visible.map(({ id, label }) => {
					const isSelected = selectedIds.includes(id)

					return (
						<label
							key={id}
							htmlFor={`${idPrefix}-${id}`}
							className={cn(
								'relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-border-strong bg-surface pr-3.5 pl-3 select-none hover:bg-surface-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus has-[:focus-visible]:outline-solid',
								inSheet && 'bg-bg',
								isSelected &&
									'border-accent-text bg-surface-accent',
							)}
							data-cy={TRAVELLER_FILTER.OPTION}>
							<input
								type="checkbox"
								id={`${idPrefix}-${id}`}
								className="sr-only"
								checked={isSelected}
								onChange={(event) =>
									onToggle(id, event.target.checked)
								}
								data-cy={TRAVELLER_FILTER.CHECKBOX}
							/>
							<span
								aria-hidden="true"
								className={cn(
									'inline-grid size-4.5 shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong text-on-accent',
									isSelected && 'border-accent bg-accent',
								)}>
								{isSelected && <TickIcon />}
							</span>
							{label}
						</label>
					)
				})}
				{visible.length === 0 && (
					<p
						className="m-0 px-1 py-2.5 text-text-muted"
						data-cy={TRAVELLER_FILTER.EMPTY}>
						{TRAVELLER_FILTER_CONFIG.NO_MATCH(query.trim())}
					</p>
				)}
			</div>
		</>
	)
}

CityChoices.propTypes = {
	idPrefix: PropTypes.string.isRequired,
	options: PropTypes.array.isRequired,
	selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	onToggle: PropTypes.func.isRequired,
	inSheet: PropTypes.bool,
}

const TravellerFilter = ({
	options,
	selectedIds = [],
	matchCount,
	onToggle,
	onShowAll,
}) => {
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	const isFiltered = selectedIds.length > 0
	const closeSheet = () => setIsSheetOpen(false)

	return (
		<>
			{/* Inline from 769px; the sheet takes over at 768px and below */}
			<fieldset
				className="m-0 my-4 border-0 p-0 mobile:hidden"
				aria-labelledby={LEGEND_ID}
				data-cy={TRAVELLER_FILTER.ROOT}>
				{/* A heading rather than a legend: a legend cannot share a flex row with the button, so the fieldset takes its name from aria-labelledby */}
				<div className="flex flex-wrap items-center justify-between gap-x-3">
					<h2
						id={LEGEND_ID}
						className="my-2 text-xl leading-normal font-bold">
						{TRAVELLER_FILTER_CONFIG.LEGEND}
					</h2>
					<ShowAllButton
						isFiltered={isFiltered}
						onShowAll={onShowAll}
					/>
				</div>
				<CityChoices
					idPrefix="filter"
					options={options}
					selectedIds={selectedIds}
					onToggle={onToggle}
				/>
				<p
					className="mt-2 mb-0 text-sm text-text-muted"
					aria-live="polite"
					data-cy={TRAVELLER_FILTER.STATUS}>
					{TRAVELLER_FILTER_CONFIG.STATUS(
						selectedIds.length,
						options.length,
					)}
				</p>
			</fieldset>
			<button
				type="button"
				className={cn(
					'my-4 hidden min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border-strong bg-surface px-4 text-[0.9375rem] font-medium text-text mobile:flex',
					isFiltered && 'border-accent-text bg-surface-accent',
				)}
				aria-haspopup="dialog"
				aria-expanded={isSheetOpen}
				onClick={() => setIsSheetOpen(true)}
				data-cy={TRAVELLER_FILTER.TRIGGER}>
				<span className="inline-flex items-center gap-2">
					<FilterIcon />
					{TRAVELLER_FILTER_CONFIG.TRIGGER_LABEL}
				</span>
				<span
					className={cn(
						'font-normal',
						isFiltered ? 'text-text' : 'text-text-muted',
					)}>
					{TRAVELLER_FILTER_CONFIG.SUMMARY(
						selectedIds.length,
						options.length,
					)}
				</span>
			</button>
			<BaseSheet
				show={isSheetOpen}
				title={TRAVELLER_FILTER_CONFIG.LEGEND}
				closeLabel={TRAVELLER_FILTER_CONFIG.CLOSE_LABEL}
				onClose={closeSheet}
				data-cy={TRAVELLER_FILTER.SHEET}
				footer={
					<>
						<ShowAllButton
							isFiltered={isFiltered}
							onShowAll={onShowAll}
						/>
						<BaseButton
							type="button"
							modeType="primary"
							className="ml-auto"
							onClick={closeSheet}
							data-cy={TRAVELLER_FILTER.SHOW_MATCHES}>
							{TRAVELLER_FILTER_CONFIG.SHOW_MATCHES(matchCount)}
						</BaseButton>
					</>
				}>
				<CityChoices
					idPrefix="sheet-filter"
					options={options}
					selectedIds={selectedIds}
					onToggle={onToggle}
					inSheet
				/>
				<p
					className="sr-only"
					aria-live="polite">
					{TRAVELLER_FILTER_CONFIG.STATUS(
						selectedIds.length,
						options.length,
					)}
				</p>
			</BaseSheet>
		</>
	)
}

TravellerFilter.propTypes = {
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		}),
	).isRequired,
	selectedIds: PropTypes.arrayOf(PropTypes.string),
	matchCount: PropTypes.number.isRequired,
	onToggle: PropTypes.func.isRequired,
	onShowAll: PropTypes.func.isRequired,
}

export default TravellerFilter
