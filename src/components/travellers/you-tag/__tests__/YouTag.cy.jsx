import { YOU_TAG_SELECTORS } from '@/constants/test'

import YouTag from '@/components/travellers/you-tag/YouTag'

describe('<YouTag />', () => {
	it('has no axe violations', () => {
		cy.mount(<YouTag />)
		cy.get(YOU_TAG_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('renders a bordered pill', () => {
		cy.mount(<YouTag />)

		cy.get(YOU_TAG_SELECTORS.ROOT)
			.should('be.visible')
			.and('have.css', 'border-top-style', 'solid')
			.then(($tag) => {
				const width = parseFloat($tag.css('border-top-width'))
				expect(width).to.be.at.least(1)
			})
	})

	it('shows "You" in sentence case, not uppercase', () => {
		cy.mount(<YouTag />)

		cy.get(YOU_TAG_SELECTORS.ROOT)
			.should('have.text', 'You')
			.and('have.css', 'text-transform', 'none')
	})
})
