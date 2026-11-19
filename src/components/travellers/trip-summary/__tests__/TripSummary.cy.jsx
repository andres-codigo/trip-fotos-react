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
	;[
		['a date range', { tripStart: '2025-03-12', tripEnd: '2025-03-19' }],
		['an older traveller', { daysInCity: 8 }],
	].forEach(([name, props]) => {
		it(`has no axe violations for ${name}`, () => {
			mountSummary(props)
			cy.get(SUMMARY).should('be.visible')
			cy.checkA11y()
		})
	})

	it('sets the summary at 14px', () => {
		mountSummary({ tripStart: '2025-03-12', tripEnd: '2025-03-19' })
		cy.get(SUMMARY).should('have.css', 'font-size', '14px')
	})
})
