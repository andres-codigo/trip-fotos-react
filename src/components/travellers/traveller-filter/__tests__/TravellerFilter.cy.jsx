import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

import { TRAVELLER_FILTER_SELECTORS } from '@/constants/test'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

describe('<TravellerFilter />', () => {
	const mountFilter = (props = {}) => {
		const onChangeFilter = cy.stub().as('onChangeFilter')
		const onChangeMany = cy.stub().as('onChangeMany')
		cy.mount(
			<TravellerFilter
				options={options}
				onChangeFilter={onChangeFilter}
				onChangeMany={onChangeMany}
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

	it('caps the list height and scrolls', () => {
		const many = Array.from({ length: 40 }, (_, i) => ({
			id: `city-${i}`,
			label: `City ${i}, Land`,
		}))
		mountFilter({ options: many })
		cy.get(TRAVELLER_FILTER_SELECTORS.LIST)
			.invoke('outerHeight')
			.should('be.at.most', 192)
		cy.get(TRAVELLER_FILTER_SELECTORS.LIST).focus().should('have.focus')
	})

	it('searches and bulk-selects the visible cities', () => {
		const many = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map(
			(name) => ({ id: name.toLowerCase(), label: `${name}, Land` }),
		)
		mountFilter({ options: many })
		cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).type('bra')
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should('have.length', 1)
		cy.get(TRAVELLER_FILTER_SELECTORS.CLEAR).click()
		cy.get('@onChangeMany').should('have.been.calledWith', ['bravo'], false)
		cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).clear().type('zzz')
		cy.get(TRAVELLER_FILTER_SELECTORS.EMPTY).should('be.visible')
	})
})
