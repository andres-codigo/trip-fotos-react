import FilterSkeleton from '@/components/travellers/filter-skeleton/FilterSkeleton'
import Input from '@/components/ui/form/input/Input'
import { FILTER_SKELETON_SELECTORS } from '@/constants/test'

const height = ($element) => $element[0].getBoundingClientRect().height

describe('<FilterSkeleton />', () => {
	it('is hidden from assistive technology', () => {
		cy.mount(<FilterSkeleton />)
		cy.get(FILTER_SKELETON_SELECTORS.ROOT).should(
			'have.attr',
			'aria-hidden',
			'true',
		)
	})

	// 768px is the last width with the sheet trigger, as in TravellerFilter
	it('shows the full-width 44px trigger bar at 768px and not the inline form', () => {
		cy.viewport(768, 800)
		cy.mount(<FilterSkeleton />)
		cy.get(FILTER_SKELETON_SELECTORS.INLINE).should('not.be.visible')
		cy.get(FILTER_SKELETON_SELECTORS.TRIGGER)
			.should('be.visible')
			.and(($bar) => {
				expect(height($bar)).to.equal(44)
				expect($bar[0].getBoundingClientRect().width).to.equal(
					$bar[0].parentElement.getBoundingClientRect().width,
				)
			})
	})

	it('shows the inline form from 769px, its search stub as tall as the field', () => {
		cy.viewport(769, 800)
		cy.mount(
			<div>
				<FilterSkeleton />
				<Input
					id="search"
					label="Search cities"
					value=""
					onChange={() => {}}
				/>
			</div>,
		)
		cy.get(FILTER_SKELETON_SELECTORS.TRIGGER).should('not.be.visible')
		cy.get(FILTER_SKELETON_SELECTORS.INLINE).should('be.visible')
		cy.get(FILTER_SKELETON_SELECTORS.SEARCH).then(($search) => {
			cy.get('#search')
				.parent()
				.should(($field) =>
					expect(height($search)).to.equal(height($field)),
				)
		})
	})
})
