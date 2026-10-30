import { COMMON_SELECTORS } from '@/constants/test'

import BaseCard from '@/components/ui/card/BaseCard'

describe('<BaseCard />', () => {
	it('renders its children', () => {
		cy.mount(
			<BaseCard>
				<p>Card content</p>
			</BaseCard>,
		)

		cy.get(COMMON_SELECTORS.BASE_CARD).should(
			'contain.text',
			'Card content',
		)
	})

	it('adds a custom class name', () => {
		cy.mount(<BaseCard className="extra">Content</BaseCard>)

		cy.get(COMMON_SELECTORS.BASE_CARD).should('have.class', 'extra')
	})

	it('is a padded, rounded, shadowed box', () => {
		cy.mount(<BaseCard>Content</BaseCard>)

		cy.get(COMMON_SELECTORS.BASE_CARD)
			.should('have.css', 'border-top-left-radius', '12px')
			.and('have.css', 'padding-top', '16px')
			.and('not.have.css', 'box-shadow', 'none')
	})

	it('has no axe violations', () => {
		cy.mount(<BaseCard>Content</BaseCard>)

		cy.get(COMMON_SELECTORS.BASE_CARD).should('exist')
		cy.checkA11y()
	})
})
