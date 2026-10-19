import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

import { TRAVELLER_FILTER_SELECTORS } from '@/constants/test'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

describe('<TravellerFilter />', () => {
	const mountFilter = (props = {}) => {
		const onChangeFilter = cy.stub().as('onChangeFilter')
		cy.mount(
			<TravellerFilter
				options={options}
				onChangeFilter={onChangeFilter}
				{...props}
			/>,
		)
	}

	it('renders a checked checkbox per option', () => {
		mountFilter()
		cy.get(TRAVELLER_FILTER_SELECTORS.ROOT).should('be.visible')
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX)
			.should('have.length', 2)
			.and('be.checked')
	})

	it('unchecks inactive options', () => {
		mountFilter({ inactiveIds: ['prague'] })
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).first().should('be.checked')
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX)
			.last()
			.should('not.be.checked')
	})

	it('calls onChangeFilter when toggled', () => {
		mountFilter({ inactiveIds: ['prague'] })
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).first().click()
		cy.get('@onChangeFilter').should('have.been.calledWith', 'tokyo', false)
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).last().click()
		cy.get('@onChangeFilter').should('have.been.calledWith', 'prague', true)
	})

	it('bolds the label of active options only', () => {
		mountFilter({ inactiveIds: ['prague'] })
		cy.contains('label', 'Tokyo, Japan').should(
			'have.css',
			'font-weight',
			'700',
		)
		cy.contains('label', 'Prague, Czechia').should(
			'have.css',
			'font-weight',
			'400',
		)
	})

	it('shows options at half width on mobile', () => {
		cy.viewport(400, 600)
		mountFilter()
		cy.get(TRAVELLER_FILTER_SELECTORS.OPTION)
			.first()
			.invoke('outerWidth')
			.then((width) => {
				cy.get(TRAVELLER_FILTER_SELECTORS.ROOT)
					.invoke('width')
					.should('be.closeTo', width * 2, 2)
			})
	})
})
