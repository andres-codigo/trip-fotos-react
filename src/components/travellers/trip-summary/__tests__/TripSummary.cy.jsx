import { getByDataCy } from '@/testUtils/cypress/selectors'

import TripSummary from '@/components/travellers/trip-summary/TripSummary'

const SUMMARY = getByDataCy('trip-summary-test')

const mountSummary = (props = {}) =>
	cy.mount(
		<TripSummary
			data-cy="trip-summary-test"
			{...props}
		/>,
	)

describe('<TripSummary />', () => {
	it('has no axe violations with a date range', () => {
		mountSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })
		cy.get(SUMMARY).should('be.visible')
		cy.checkA11y()
	})

	it('has no axe violations for an older traveller', () => {
		mountSummary({ daysInCity: 8 })
		cy.get(SUMMARY).should('be.visible')
		cy.checkA11y()
	})

	it('shows the range and length, with the "Trip:" prefix visually hidden', () => {
		mountSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })

		cy.get(SUMMARY)
			.invoke('text')
			.should('eq', 'Trip: 12–19 Mar 2025, ·8 days')
		cy.get(SUMMARY).contains('Trip:').should('have.class', 'sr-only')
		cy.get(SUMMARY).should('have.css', 'font-size', '14px')
	})
})
