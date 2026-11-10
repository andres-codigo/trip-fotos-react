import { useState } from 'react'

import PropTypes from 'prop-types'

import TravellerFilter from '@/components/travellers/traveller-filter/TravellerFilter'

import { TRAVELLER_FILTER_SELECTORS } from '@/constants/test'
import { TRAVELLER_FILTER_CONFIG } from '@/constants/travellers'

const options = [
	{ id: 'tokyo', label: 'Tokyo, Japan' },
	{ id: 'prague', label: 'Prague, Czechia' },
]

const many = Array.from({ length: 40 }, (_, i) => ({
	id: `city-${i}`,
	label: `City ${i}, Land`,
}))

// Holds the ticks like useCityFilter does
const StatefulFilter = ({ filterOptions = options, onShowAll = () => {} }) => {
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
			onShowAll={() => {
				onShowAll()
				setSelectedIds([])
			}}
		/>
	)
}

StatefulFilter.propTypes = {
	filterOptions: PropTypes.array,
	onShowAll: PropTypes.func,
}

const checkbox = (label) => cy.contains('label', label).find('input')

describe('<TravellerFilter />', () => {
	describe('desktop, from 769px', () => {
		beforeEach(() => cy.viewport(1280, 800))

		it('shows the inline filter and hides the trigger', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.ROOT).should('be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should('not.be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX)
				.should('have.length', 2)
				.and('not.be.checked')
			cy.checkA11y()
		})

		it('ticks a chip on a label click, styles it and enables Show all cities', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).should(
				'have.attr',
				'aria-disabled',
				'true',
			)
			cy.contains('label', 'Tokyo, Japan').click()
			checkbox('Tokyo, Japan').should('be.checked')
			cy.contains('label', 'Tokyo, Japan')
				.should('have.css', 'background-color', 'rgb(44, 53, 35)')
				.and('have.css', 'border-top-color', 'rgb(169, 201, 138)')
			cy.get(TRAVELLER_FILTER_SELECTORS.STATUS).should(
				'have.text',
				'1 of 2 cities selected',
			)

			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL)
				.should('have.attr', 'aria-disabled', 'false')
				.click()
			checkbox('Tokyo, Japan').should('not.be.checked')
			cy.get(TRAVELLER_FILTER_SELECTORS.STATUS).should(
				'have.text',
				'All 2 cities',
			)
		})

		it('keeps focus on Show all cities after a reset', () => {
			cy.mount(<StatefulFilter />)

			cy.contains('label', 'Tokyo, Japan').click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).focus()
			cy.focused().type('{enter}')
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).should('have.focus')
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

		it('caps the list height, scrolls, and searches', () => {
			cy.mount(<StatefulFilter filterOptions={many} />)

			cy.get(TRAVELLER_FILTER_SELECTORS.LIST)
				.invoke('outerHeight')
				.should('be.at.most', 192)
			cy.get(TRAVELLER_FILTER_SELECTORS.LIST).focus().should('have.focus')

			cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).type('City 1,')
			cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should('have.length', 1)
			cy.get(TRAVELLER_FILTER_SELECTORS.SEARCH).clear().type('zzz')
			cy.get(TRAVELLER_FILTER_SELECTORS.EMPTY).should(
				'have.text',
				TRAVELLER_FILTER_CONFIG.NO_MATCH('zzz'),
			)
		})
	})

	describe('mobile, 768px and below', () => {
		beforeEach(() => cy.viewport(390, 844))

		it('shows the trigger instead of the inline filter', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.ROOT).should('not.be.visible')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER)
				.should('be.visible')
				.and('contain.text', 'All 2 cities')
				.invoke('outerHeight')
				.should('be.at.least', 44)
		})

		it('still shows the trigger at 768px', () => {
			cy.viewport(768, 1024)
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should('be.visible')
		})

		it('filters in the sheet, closes on the main button and returns focus to the trigger', () => {
			cy.mount(<StatefulFilter />)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('be.visible')
			cy.checkA11y()

			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.contains('label', 'Prague, Czechia')
				.click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES)
				.should('have.text', 'Show 1 traveller')
				.click()

			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('not.exist')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER)
				.should('have.focus')
				.and('contain.text', '1 of 2 cities')
				.and('have.css', 'background-color', 'rgb(44, 53, 35)')
		})

		it('closes on Escape and resets from the footer', () => {
			const onShowAll = cy.stub().as('onShowAll')
			cy.mount(<StatefulFilter onShowAll={onShowAll} />)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.contains('label', 'Tokyo, Japan')
				.click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.find(TRAVELLER_FILTER_SELECTORS.SHOW_ALL)
				.click()
			cy.get('@onShowAll').should('have.been.calledOnce')
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.contains('label', 'Tokyo, Japan')
				.find('input')
				.should('not.be.checked')

			cy.get('body').type('{esc}')
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET).should('not.exist')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should('have.focus')
		})

		it('scrolls a long list inside the sheet, keeping the footer in view', () => {
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
