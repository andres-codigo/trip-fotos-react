import { MemoryRouter } from 'react-router-dom'

import { TOP_NAVIGATION_SELECTORS } from '@/constants/test'

import NavMenuMessagesLink from '@/components/layout/main-nav/nav-menu/NavMenuMessagesLink'

const mountLink = (props = {}) =>
	cy.mount(
		<MemoryRouter>
			<ul>
				<NavMenuMessagesLink
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
		mountLink({ unreadMessages: 3 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('have.text', '3')
		cy.get('li a')
			.should('have.attr', 'aria-label', 'Messages, 3 unread messages')
			.invoke('prop', 'innerText')
			.then((text) => text.replace(/\s+/g, ' ').trim())
			.should('eq', 'Messages 3')
	})

	it('uses the singular for one unread message', () => {
		mountLink({ unreadMessages: 1 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('have.text', '1')
		cy.get('li a').should(
			'have.attr',
			'aria-label',
			'Messages, 1 unread message',
		)
	})

	it('shows no count and a plain name when nothing is unread', () => {
		mountLink({ unreadMessages: 0 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
		cy.get('li a')
			.should('have.attr', 'aria-label', 'Messages')
			.and('have.prop', 'innerText', 'Messages')
	})

	it('shows no count when the unread count is not known yet', () => {
		mountLink()

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('not.exist')
	})

	it('has no axe violations', () => {
		mountLink({ unreadMessages: 0 })

		cy.get('li a').should('exist')
		cy.checkA11y()
	})

	it('has no axe violations with the count shown', () => {
		mountLink({ unreadMessages: 3 })

		cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should('be.visible')
		cy.checkA11y()
	})
})
