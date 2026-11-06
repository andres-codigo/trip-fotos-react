import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { TRAVELLER_FILTER } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

const renderFilter = (props = {}) => {
	const onChangeFilter = vi.fn()
	const onChangeMany = vi.fn()
	render(
		<TravellerFilter
			options={props.options ?? options}
			onChangeFilter={onChangeFilter}
			onChangeMany={onChangeMany}
			{...props}
		/>,
	)
	return Object.assign(onChangeFilter, { onChangeMany })
}

const manyOptions = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map(
	(name) => ({ id: name.toLowerCase(), label: `${name}, Land` }),
)

const search = (value) =>
	fireEvent.change(screen.getByTestId(TRAVELLER_FILTER.SEARCH), {
		target: { value },
	})

describe('<TravellerFilter />', () => {
	it('renders the legend and one checkbox per option', () => {
		renderFilter()
		expect(screen.getByTestId(TRAVELLER_FILTER.ROOT)).toHaveTextContent(
			TRAVELLER_FILTER_CONFIG.LEGEND,
		)
		expect(screen.getAllByTestId(TRAVELLER_FILTER.CHECKBOX)).toHaveLength(2)
		expect(screen.getByLabelText('Tokyo, Japan')).toHaveAttribute(
			'id',
			'filter-tokyo',
		)
	})

	it('names the fieldset from its heading', () => {
		renderFilter()
		expect(
			screen.getByRole('group', { name: TRAVELLER_FILTER_CONFIG.LEGEND }),
		).toHaveAttribute('data-cy', TRAVELLER_FILTER.ROOT)
	})

	it('renders Select all and Clear as buttons, not links', () => {
		renderFilter()
		;[TRAVELLER_FILTER.SELECT_ALL, TRAVELLER_FILTER.CLEAR].forEach((id) => {
			const control = screen.getByTestId(id)
			expect(control.tagName).toBe('BUTTON')
			expect(control).toHaveAttribute('type', 'button')
		})
	})

	it('checks all options by default', () => {
		renderFilter()
		screen
			.getAllByTestId(TRAVELLER_FILTER.CHECKBOX)
			.forEach((box) => expect(box).toBeChecked())
	})

	it('unchecks inactive options', () => {
		renderFilter({ inactiveIds: ['prague'] })
		expect(screen.getByLabelText('Tokyo, Japan')).toBeChecked()
		expect(screen.getByLabelText('Prague, Czechia')).not.toBeChecked()
	})

	it('calls onChangeFilter with false when unchecking', () => {
		const onChangeFilter = renderFilter()
		fireEvent.click(screen.getByLabelText('Tokyo, Japan'))
		expect(onChangeFilter).toHaveBeenCalledWith('tokyo', false)
	})

	it('calls onChangeFilter with true when checking', () => {
		const onChangeFilter = renderFilter({ inactiveIds: ['prague'] })
		fireEvent.click(screen.getByLabelText('Prague, Czechia'))
		expect(onChangeFilter).toHaveBeenCalledWith('prague', true)
	})

	it('checks only the active options', () => {
		renderFilter({ inactiveIds: ['prague'] })
		expect(screen.getByLabelText('Tokyo, Japan')).toBeChecked()
		expect(screen.getByLabelText('Prague, Czechia')).not.toBeChecked()
	})

	it('hides search but keeps the bulk buttons at or below the threshold', () => {
		const spy = renderFilter({ options: manyOptions.slice(0, 4) })
		expect(screen.queryByTestId(TRAVELLER_FILTER.SEARCH)).toBeNull()
		fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.CLEAR))
		expect(spy.onChangeMany).toHaveBeenCalledWith(
			['alpha', 'bravo', 'charlie', 'delta'],
			false,
		)
		fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.SELECT_ALL))
		expect(spy.onChangeMany).toHaveBeenCalledWith(
			['alpha', 'bravo', 'charlie', 'delta'],
			true,
		)
	})

	it('shows search above the threshold and filters by label', () => {
		renderFilter({ options: manyOptions })
		search('bra')
		expect(screen.getAllByTestId(TRAVELLER_FILTER.CHECKBOX)).toHaveLength(1)
		expect(screen.getByLabelText('Bravo, Land')).toBeInTheDocument()
	})

	it('shows an empty message when no city matches', () => {
		renderFilter({ options: manyOptions })
		search('zzz')
		expect(screen.getByTestId(TRAVELLER_FILTER.EMPTY)).toHaveTextContent(
			TRAVELLER_FILTER_CONFIG.NO_MATCH,
		)
	})

	it('keeps the checked state of cities hidden by the search', () => {
		renderFilter({ options: manyOptions, inactiveIds: ['alpha'] })
		search('bra')
		search('')
		expect(screen.getByLabelText('Alpha, Land')).not.toBeChecked()
		expect(screen.getByLabelText('Bravo, Land')).toBeChecked()
	})

	it('selects and clears every option without a search', () => {
		const spy = renderFilter({ options: manyOptions })
		const ids = manyOptions.map(({ id }) => id)
		fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.SELECT_ALL))
		expect(spy.onChangeMany).toHaveBeenCalledWith(ids, true)
		fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.CLEAR))
		expect(spy.onChangeMany).toHaveBeenCalledWith(ids, false)
	})

	it('acts only on the searched options in bulk', () => {
		const spy = renderFilter({ options: manyOptions })
		search('e')
		fireEvent.click(screen.getByTestId(TRAVELLER_FILTER.CLEAR))
		expect(spy.onChangeMany).toHaveBeenCalledWith(
			['charlie', 'delta', 'echo'],
			false,
		)
	})

	it('announces how many cities are selected', () => {
		renderFilter({ options: manyOptions, inactiveIds: ['alpha', 'echo'] })
		const status = screen.getByTestId(TRAVELLER_FILTER.STATUS)
		expect(status).toHaveTextContent('3 of 5 cities selected')
		expect(status).toHaveAttribute('aria-live', 'polite')
	})

	it('makes the capped list keyboard-focusable', () => {
		renderFilter()
		expect(screen.getByTestId(TRAVELLER_FILTER.LIST)).toHaveAttribute(
			'tabindex',
			'0',
		)
	})
})
