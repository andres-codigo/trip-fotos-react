import { MemoryRouter } from 'react-router-dom'

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
	;[0, 3].forEach((unreadMessages) => {
		it(`has no axe violations with ${unreadMessages} unread`, () => {
			mountLink({ unreadMessages })

			cy.get('li a').should('be.visible')
			cy.checkA11y()
		})
	})
})
