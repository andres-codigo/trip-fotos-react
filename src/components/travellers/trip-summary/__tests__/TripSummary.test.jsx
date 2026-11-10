import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TripSummary from '@/components/travellers/trip-summary/TripSummary'

const DATA_CY = 'trip-summary-test'

const renderSummary = (props = {}) =>
	render(
		<TripSummary
			data-cy={DATA_CY}
			{...props}
		/>,
	)

const getSummary = () => screen.getByTestId(DATA_CY)

describe('<TripSummary />', () => {
	it('shows a same-month range and the trip length', () => {
		renderSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })

		expect(getSummary()).toHaveTextContent(
			/^Trip: 12–19 Mar 2025, ·8 days$/,
		)
		expect(screen.getByText('12–19 Mar 2025')).toHaveClass(
			'font-medium',
			'text-text',
		)
		expect(screen.getByText('8 days')).toHaveClass('text-text-muted')
	})

	it('hides the separator from screen readers', () => {
		renderSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })

		expect(screen.getByText('·')).toHaveAttribute('aria-hidden', 'true')
	})

	it('shows both years for a range that crosses a year', () => {
		renderSummary({ tripStart: '2024-12-28', tripEnd: '2025-01-03' })

		expect(getSummary()).toHaveTextContent(
			/^Trip: 28 Dec 2024 – 3 Jan 2025, ·7 days$/,
		)
	})

	it('shows "1 day" for a day trip', () => {
		renderSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-12' })

		expect(getSummary()).toHaveTextContent(/^Trip: 12 Mar 2025, ·1 day$/)
	})

	it.each([
		['number', 8],
		['string', '8'],
	])(
		'shows only the length for an older traveller with a %s daysInCity',
		(_, daysInCity) => {
			renderSummary({ daysInCity })

			expect(getSummary()).toHaveTextContent(/^Trip: 8 days$/)
			expect(screen.queryByText('·')).not.toBeInTheDocument()
			expect(screen.getByText('8 days')).not.toHaveClass(
				'text-text-muted',
			)
		},
	)

	it('renders nothing when no trip is stored', () => {
		const { container } = renderSummary()

		expect(container).toBeEmptyDOMElement()
	})

	it('starts with a visually hidden "Trip:" prefix', () => {
		renderSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })

		expect(screen.getByText('Trip:')).toHaveClass('sr-only')
	})

	it('merges a className passed by the parent', () => {
		renderSummary({ daysInCity: 3, className: 'mt-2' })

		expect(getSummary()).toHaveClass('mt-2', 'text-sm')
	})
})
