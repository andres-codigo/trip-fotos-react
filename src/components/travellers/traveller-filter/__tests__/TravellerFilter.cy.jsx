import { useState } from 'react'

import PropTypes from 'prop-types'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

import { TRAVELLER_FILTER_SELECTORS } from '@/constants/test'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

const many = Array.from({ length: 40 }, (_, i) => ({
	id: `city-${i}`,
	label: `City ${i}, Land`,
}))

// Holds the ticks like useCityFilter does
const StatefulFilter = ({ filterOptions = options }) => {
	const [selectedIds, setSelectedIds] = useState([])
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

StatefulFilter.propTypes = {
	filterOptions: PropTypes.array,
}

const checkbox = (label) => cy.contains('label', label).find('input')

describe('<TravellerFilter />', () => {
	describe('desktop, from 769px', () => {
		beforeEach(() => cy.viewport(1280, 800))

		it('shows the inline filter and hides the trigger', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.ROOT).should('be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should('not.be.visible')
			cy.checkA11y()
		})

		it('styles a ticked chip', () => {
			cy.mount(<StatefulFilter />)

			cy.contains('label', 'Tokyo, Japan').click()
			cy.contains('label', 'Tokyo, Japan')
				.should('have.css', 'background-color', 'rgb(44, 53, 35)')
				.and('have.css', 'border-top-color', 'rgb(169, 201, 138)')
		})

		it('gives chips a 44px target and keeps the hidden checkbox focusable', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.OPTION)
				.first()
				.invoke('outerHeight')
				.should('be.at.least', 44)
			checkbox('Prague, Czechia').focus().should('have.focus')
		})

		it("keeps a chip's 5px focus ring (3px ring, 2px offset) inside the scrolling list", () => {
			cy.mount(<StatefulFilter filterOptions={many} />)

			cy.get(TRAVELLER_FILTER_SELECTORS.LIST).then(($list) => {
				const list = $list[0].getBoundingClientRect()
				const chip = $list
					.find(TRAVELLER_FILTER_SELECTORS.OPTION)[0]
					.getBoundingClientRect()
				expect(chip.top - list.top).to.be.at.least(5)
				expect(chip.left - list.left).to.be.at.least(5)
			})
		})

		it('caps the list height and lets the keyboard scroll it', () => {
			cy.mount(<StatefulFilter filterOptions={many} />)

			cy.get(TRAVELLER_FILTER_SELECTORS.LIST)
				.invoke('outerHeight')
				.should('be.at.most', 192)
			cy.get(TRAVELLER_FILTER_SELECTORS.LIST).focus().should('have.focus')
		})
	})

	describe('mobile, 768px and below', () => {
		;[
			[390, 844],
			[768, 1024],
		].forEach(([width, height]) => {
			it(`shows a 44px trigger instead of the inline filter at ${width}px`, () => {
				cy.viewport(width, height)
				cy.mount(<StatefulFilter />)

				cy.get(TRAVELLER_FILTER_SELECTORS.ROOT).should('not.be.visible')
				cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER)
					.should('be.visible')
					.invoke('outerHeight')
					.should('be.at.least', 44)
			})
		})

		it('has no axe violations in the open sheet, and styles the trigger of an active filter', () => {
			cy.viewport(390, 844)
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('be.visible')
			cy.checkA11y()

			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.contains('label', 'Prague, Czechia')
				.click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('not.exist')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should(
				'have.css',
				'background-color',
				'rgb(44, 53, 35)',
			)
		})

		it('scrolls a long list inside the sheet, keeping the footer in view', () => {
			cy.viewport(390, 844)
			cy.mount(<StatefulFilter filterOptions={many} />)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).should('be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES).should('be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.invoke('outerHeight')
				.should('be.at.most', 844)
		})
	})
})
