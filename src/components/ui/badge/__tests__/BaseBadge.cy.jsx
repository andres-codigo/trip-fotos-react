import { COMMON_SELECTORS } from '@/constants/test'
import { TRAVELLER_AREAS } from '@/constants/travellers'

import BaseBadge from '@/components/ui/badge/BaseBadge'

describe('<BaseBadge />', () => {
	it('keeps the title in sentence case', () => {
		cy.mount(<BaseBadge title="Prague" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE).should(
			'have.css',
			'text-transform',
			'none',
		)
	})

	// A label is shorter than a button (46px), so the two cannot be mistaken for each other
	it('is smaller than a button', () => {
		cy.mount(<BaseBadge title="Prague" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.should('have.css', 'font-size', '14px')
			.and(($badge) =>
				expect($badge[0].getBoundingClientRect().height).to.equal(28),
			)
	})

	it('renders every area type with dark on-badge ink', () => {
		cy.mount(
			<>
				{TRAVELLER_AREAS.map((area) => (
					<BaseBadge
						key={area}
						type={area}
						title={area}
					/>
				))}
			</>,
		)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.should('have.length', TRAVELLER_AREAS.length)
			.each(($badge) =>
				expect($badge).to.have.css('color', 'rgb(20, 19, 15)'),
			)
	})

	it('gives different cities different background colours', () => {
		cy.mount(
			<>
				<BaseBadge
					type="tokyo"
					title="Tokyo"
				/>
				<BaseBadge
					type="prague"
					title="Prague"
				/>
			</>,
		)
		cy.get(COMMON_SELECTORS.BASE_BADGE)
			.first()
			.invoke('css', 'background-color')
			.then((first) => {
				cy.get(COMMON_SELECTORS.BASE_BADGE)
					.last()
					.should('not.have.css', 'background-color', first)
			})
	})

	it('uses the default colour without a type', () => {
		cy.mount(<BaseBadge title="Other" />)
		cy.get(COMMON_SELECTORS.BASE_BADGE).should(
			'have.css',
			'color',
			'rgb(239, 233, 218)',
		)
	})

	it('has no axe violations for the default and every area type', () => {
		const areas = [undefined, ...TRAVELLER_AREAS]
		cy.mount(
			<>
				{areas.map((area) => (
					<BaseBadge
						key={area ?? 'default'}
						type={area}
						title="Prague"
					/>
				))}
			</>,
		)

		cy.get(COMMON_SELECTORS.BASE_BADGE).should('have.length', areas.length)
		cy.checkA11y()
	})
})
