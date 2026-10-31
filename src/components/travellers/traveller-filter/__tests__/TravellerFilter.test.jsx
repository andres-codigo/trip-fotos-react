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
	render(
		<TravellerFilter
			options={options}
			onChangeFilter={onChangeFilter}
			{...props}
		/>,
	)
	return onChangeFilter
}

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
})
