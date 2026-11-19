import { YOU_TAG_SELECTORS } from '@/constants/test'

import YouTag from '@/components/travellers/you-tag/YouTag'

describe('<YouTag />', () => {
	it('renders a bordered pill in sentence case, with no axe violations', () => {
		cy.mount(<YouTag />)

		cy.get(YOU_TAG_SELECTORS.ROOT)
			.should('be.visible')
			.and('have.css', 'text-transform', 'none')
			.and('have.css', 'border-top-style', 'solid')
			.then(($tag) => {
				expect(parseFloat($tag.css('border-top-width'))).to.be.at.least(
					1,
				)
			})
		cy.checkA11y()
	})
})
