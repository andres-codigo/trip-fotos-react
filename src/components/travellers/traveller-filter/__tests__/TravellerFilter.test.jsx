import { useState } from 'react'

import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

const manyOptions = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map(
	(name) => ({ id: name.toLowerCase(), label: `${name}, Land` }),
)

const renderFilter = (props = {}) => {
	const onToggle = vi.fn()
	const onShowAll = vi.fn()
	render(
		<TravellerFilter
			options={options}
			matchCount={4}
			onToggle={onToggle}
			onShowAll={onShowAll}
			{...props}
		/>,
	)
	return { onToggle, onShowAll }
}

// Holds the ticks like useCityFilter does, so a test can follow the filter through several clicks
const StatefulFilter = ({ initial = [], filterOptions = options }) => {
	const [selectedIds, setSelectedIds] = useState(initial)
	return (
		<TravellerFilter
			options={filterOptions}
			selectedIds={selectedIds}
			matchCount={selectedIds.length || 9}
			onToggle={(id, isSelected) =>
				setSelectedIds((previous) =>
					isSelected
						? [...previous, id]
						: previous.filter((item) => item !== id),
				)
			}
			onShowAll={() => setSelectedIds([])}
		/>
	)
}

const inline = () => within(screen.getByTestId(TRAVELLER_FILTER.ROOT))

const search = (value, scope = inline()) =>
	fireEvent.change(scope.getByTestId(TRAVELLER_FILTER.SEARCH), {
		target: { value },
	})

const openSheet = () => {
	fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.TRIGGER))
	return within(screen.getByRole('dialog'))
}

describe('<TravellerFilter />', () => {
	describe('inline filter', () => {
		it('names the fieldset from its heading and renders one unticked checkbox per option', () => {
			renderFilter()

			expect(
				screen.getByRole('group', {
					name: TRAVELLER_FILTER_CONFIG.LEGEND,
				}),
			).toHaveAttribute('data-cy', TRAVELLER_FILTER.ROOT)
			const checkboxes = inline().getAllByTestId(
				TRAVELLER_FILTER.CHECKBOX,
			)
			expect(checkboxes).toHaveLength(2)
			checkboxes.forEach((checkbox) => expect(checkbox).not.toBeChecked())
			expect(inline().getByLabelText('Tokyo, Japan')).toHaveAttribute(
				'id',
				'filter-tokyo',
			)
		})

		it('ticks the selected options only', () => {
			renderFilter({ selectedIds: ['prague'] })

			expect(inline().getByLabelText('Prague, Czechia')).toBeChecked()
			expect(inline().getByLabelText('Tokyo, Japan')).not.toBeChecked()
		})

		it('calls onToggle with the new state', () => {
			const { onToggle } = renderFilter({ selectedIds: ['prague'] })

			fireEvent.click(inline().getByLabelText('Tokyo, Japan'))
			expect(onToggle).toHaveBeenCalledWith('tokyo', true)

			fireEvent.click(inline().getByLabelText('Prague, Czechia'))
			expect(onToggle).toHaveBeenCalledWith('prague', false)
		})

		it('offers Show all cities as a button, disabled until a city is ticked', () => {
			const { onShowAll } = renderFilter()
			const showAll = inline().getByTestId(TRAVELLER_FILTER.SHOW_ALL)

			expect(showAll.tagName).toBe('BUTTON')
			expect(showAll).toHaveAttribute('type', 'button')
			expect(showAll).toHaveTextContent(TRAVELLER_FILTER_CONFIG.SHOW_ALL)
			expect(showAll).toHaveAttribute('aria-disabled', 'true')

			fireEvent.click(showAll)
			expect(onShowAll).not.toHaveBeenCalled()
		})

		it('calls onShowAll once a city is ticked', () => {
			const { onShowAll } = renderFilter({ selectedIds: ['tokyo'] })
			const showAll = inline().getByTestId(TRAVELLER_FILTER.SHOW_ALL)

			expect(showAll).toHaveAttribute('aria-disabled', 'false')
			fireEvent.click(showAll)
			expect(onShowAll).toHaveBeenCalledTimes(1)
		})

		it('announces the selection politely', () => {
			const { rerender } = render(
				<TravellerFilter
					options={options}
					matchCount={4}
					onToggle={vi.fn()}
					onShowAll={vi.fn()}
				/>,
			)
			const status = screen.getByTestId(TRAVELLER_FILTER.STATUS)

			expect(status).toHaveAttribute('aria-live', 'polite')
			expect(status).toHaveTextContent('All 2 cities')

			rerender(
				<TravellerFilter
					options={options}
					selectedIds={['tokyo']}
					matchCount={1}
					onToggle={vi.fn()}
					onShowAll={vi.fn()}
				/>,
			)
			expect(status).toHaveTextContent('1 of 2 cities selected')
		})

		it('hides the search at or below the threshold', () => {
			renderFilter({ options: manyOptions.slice(0, 4) })

			expect(
				inline().queryByTestId(TRAVELLER_FILTER.SEARCH),
			).not.toBeInTheDocument()
		})

		it('narrows the chips by search and says when nothing matches', () => {
			renderFilter({ options: manyOptions })

			search('cha')
			expect(
				inline().getAllByTestId(TRAVELLER_FILTER.CHECKBOX),
			).toHaveLength(1)

			search('zzz')
			expect(
				inline().queryByTestId(TRAVELLER_FILTER.CHECKBOX),
			).not.toBeInTheDocument()
			expect(
				inline().getByTestId(TRAVELLER_FILTER.EMPTY),
			).toHaveTextContent(TRAVELLER_FILTER_CONFIG.NO_MATCH('zzz'))
		})

		it('keeps ticks on cities hidden by the search', () => {
			render(
				<StatefulFilter
					initial={['alpha']}
					filterOptions={manyOptions}
				/>,
			)

			search('bra')
			fireEvent.click(inline().getByLabelText('Bravo, Land'))
			search('')

			expect(inline().getByLabelText('Alpha, Land')).toBeChecked()
			expect(inline().getByLabelText('Bravo, Land')).toBeChecked()
		})
	})

	describe('mobile trigger and sheet', () => {
		it('summarises the filter on the trigger', () => {
			render(<StatefulFilter />)
			const trigger = screen.getByTestId(TRAVELLER_FILTER.TRIGGER)

			expect(trigger).toHaveAttribute('type', 'button')
			expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
			expect(trigger).toHaveAttribute('aria-expanded', 'false')
			expect(trigger).toHaveTextContent(
				`${TRAVELLER_FILTER_CONFIG.TRIGGER_LABEL}All 2 cities`,
			)

			fireEvent.click(inline().getByLabelText('Tokyo, Japan'))
			expect(trigger).toHaveTextContent('1 of 2 cities')
		})

		it('opens a named modal sheet with its own checkboxes', () => {
			render(<StatefulFilter />)
			const sheet = openSheet()

			expect(
				screen.getByRole('dialog', {
					name: TRAVELLER_FILTER_CONFIG.LEGEND,
				}),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(TRAVELLER_FILTER.TRIGGER),
			).toHaveAttribute('aria-expanded', 'true')
			expect(sheet.getByLabelText('Tokyo, Japan')).toHaveAttribute(
				'id',
				'sheet-filter-tokyo',
			)
		})

		it('filters live and states the result on the main button', () => {
			render(<StatefulFilter />)
			const sheet = openSheet()

			expect(
				sheet.getByTestId(TRAVELLER_FILTER.SHOW_MATCHES),
			).toHaveTextContent(TRAVELLER_FILTER_CONFIG.SHOW_MATCHES(9))

			fireEvent.click(sheet.getByLabelText('Prague, Czechia'))

			expect(sheet.getByLabelText('Prague, Czechia')).toBeChecked()
			expect(inline().getByLabelText('Prague, Czechia')).toBeChecked()
			expect(
				sheet.getByTestId(TRAVELLER_FILTER.SHOW_MATCHES),
			).toHaveTextContent('Show 1 traveller')
		})

		it('resets from the sheet footer', () => {
			render(<StatefulFilter initial={['tokyo']} />)
			const sheet = openSheet()

			fireEvent.click(sheet.getByTestId(TRAVELLER_FILTER.SHOW_ALL))

			expect(sheet.getByLabelText('Tokyo, Japan')).not.toBeChecked()
			expect(
				sheet.getByTestId(TRAVELLER_FILTER.SHOW_ALL),
			).toHaveAttribute('aria-disabled', 'true')
		})

		it.each([
			[
				'the main button',
				(sheet) =>
					fireEvent.click(
						sheet.getByTestId(TRAVELLER_FILTER.SHOW_MATCHES),
					),
			],
			[
				'the close button',
				(sheet) =>
					fireEvent.click(
						sheet.getByRole('button', {
							name: TRAVELLER_FILTER_CONFIG.CLOSE_LABEL,
						}),
					),
			],
			[
				'Escape',
				() =>
					fireEvent.keyDown(screen.getByRole('dialog'), {
						key: 'Escape',
					}),
			],
		])('closes on %s and keeps the ticks', (_, close) => {
			render(<StatefulFilter />)
			const sheet = openSheet()
			fireEvent.click(sheet.getByLabelText('Tokyo, Japan'))

			close(sheet)

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			expect(
				screen.getByTestId(TRAVELLER_FILTER.TRIGGER),
			).toHaveTextContent('1 of 2 cities')
		})

		it('starts the sheet search empty each time it opens', () => {
			render(<StatefulFilter filterOptions={manyOptions} />)
			let sheet = openSheet()
			search('alp', sheet)
			fireEvent.click(sheet.getByTestId(TRAVELLER_FILTER.SHOW_MATCHES))

			sheet = openSheet()
			expect(sheet.getByTestId(TRAVELLER_FILTER.SEARCH)).toHaveValue('')
		})
	})
})
