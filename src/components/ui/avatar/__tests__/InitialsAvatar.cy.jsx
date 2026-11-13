import { AVATAR_SELECTORS } from '@/constants/test'

import InitialsAvatar from '@/components/ui/avatar/InitialsAvatar'

describe('<InitialsAvatar />', () => {
	it('renders a 40px circle', () => {
		cy.mount(<InitialsAvatar name="Amara Okafor" />)
		cy.get(AVATAR_SELECTORS.ROOT)
			.should('have.text', 'AO')
			.then(($avatar) => {
				const { width, height } = $avatar[0].getBoundingClientRect()
				const radius = parseFloat($avatar.css('border-top-left-radius'))
				expect(width).to.equal(40)
				expect(height).to.equal(40)
				// A radius of at least half the side rounds the square into a circle
				expect(radius).to.be.at.least(width / 2)
			})
	})

	it('has no axe violations', () => {
		cy.mount(<InitialsAvatar name="Amara Okafor" />)
		cy.get(AVATAR_SELECTORS.ROOT).should('exist')
		cy.checkA11y()
	})
})
