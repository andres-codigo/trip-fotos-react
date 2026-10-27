import { MemoryRouter } from 'react-router-dom'

import { TOP_NAVIGATION_SELECTORS } from '@/constants/test'

import NavMenuMessagesLink from '@/components/layout/main-nav/nav-menu/NavMenuMessagesLink'

const mountLink = (props = {}) =>
	cy.mount(
		<MemoryRouter>
			<ul>
				<NavMenuMessagesLink
					isLink
					to="/messages"
					{...props}
				/>
			</ul>
		</MemoryRouter>,
	)

describe('<NavMenuMessagesLink />', () => {
	it('links to the messages page', () => {
		mountLink()

		cy.get('li a')
			.should('have.attr', 'href', '/messages')
			.and('contain.text', 'Messages')
	})

	it('shows the unread count and puts it in the accessible name', () => {
		mountLink({ totalMessages: 3 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('have.text', '3')
		cy.get('li a')
			.should('have.attr', 'aria-label', 'Messages 3')
			.and('have.prop', 'innerText', 'Messages 3')
	})

	it('shows no count and a plain name when there are no messages', () => {
		mountLink({ totalMessages: 0 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
		cy.get('li a')
			.should('have.attr', 'aria-label', 'Messages')
			.and('have.prop', 'innerText', 'Messages')
	})

	it('shows no count when the total is not known yet', () => {
		mountLink()

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
	})

	it('has no axe violations', () => {
		mountLink({ totalMessages: 0 })

		cy.get('li a').should('exist')
		cy.checkA11y()
	})

	it('has no axe violations with the count shown', () => {
		mountLink({ totalMessages: 3 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('be.visible')
		cy.checkA11y()
	})
})
