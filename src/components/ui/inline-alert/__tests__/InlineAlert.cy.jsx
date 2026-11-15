import { COMMON_SELECTORS } from '@/constants/test'

import InlineAlert from '@/components/ui/inline-alert/InlineAlert'

describe('<InlineAlert />', () => {
	it('shows the message beside a hidden icon and has no axe violations', () => {
		cy.mount(<InlineAlert>We could not send the email.</InlineAlert>)

		cy.get(COMMON_SELECTORS.INLINE_ALERT)
			.should('be.visible')
			.and('have.attr', 'role', 'alert')
			.and('contain.text', 'We could not send the email.')
			.find('svg')
			.should('have.attr', 'aria-hidden', 'true')
		cy.get(COMMON_SELECTORS.INLINE_ALERT).find('button').should('not.exist')
		cy.checkA11y()
	})

	it('wraps a long unbroken address inside the alert at a narrow width', () => {
		cy.viewport(320, 640)
		cy.mount(
			<InlineAlert>
				Open the link we sent to
				a.rather.long.address.that.must.wrap@example-domain.com, then
				try again.
			</InlineAlert>,
		)

		cy.get(COMMON_SELECTORS.INLINE_ALERT).then(($alert) => {
			const box = $alert[0].getBoundingClientRect()
			const text = $alert.find('span')[0].getBoundingClientRect()
			expect(text.right).to.be.at.most(box.right)
			expect($alert[0].scrollWidth).to.be.at.most($alert[0].clientWidth)
		})
	})
})
