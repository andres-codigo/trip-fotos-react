import { MemoryRouter } from 'react-router-dom'

import { GLOBAL } from '@/constants/ui'

import NavMenuButtonLink from '@/components/layout/main-nav/nav-menu/NavMenuButtonLink'

const MOBILE_WIDTH = GLOBAL.BREAKPOINT.MOBILE - 100
const DESKTOP_WIDTH = GLOBAL.BREAKPOINT.TABLET + 200

const mountLink = (props = {}) =>
	cy.mount(
		<MemoryRouter>
			<NavMenuButtonLink
				isLink
				to="/travellers"
				{...props}>
				Travellers
			</NavMenuButtonLink>
		</MemoryRouter>,
	)

describe('<NavMenuButtonLink />', () => {
	it('renders a link to the given path', () => {
		mountLink()

		cy.get('a')
			.should('have.attr', 'href', '/travellers')
			.and('contain.text', 'Travellers')
	})

	it('renders a button when it is not a link', () => {
		cy.mount(<NavMenuButtonLink>Logout</NavMenuButtonLink>)

		cy.get('button').should('contain.text', 'Logout')
		cy.get('a').should('not.exist')
	})

	it('calls onClick when clicked', () => {
		const onClick = cy.stub().as('onClick')
		cy.mount(
			<NavMenuButtonLink onClick={onClick}>Logout</NavMenuButtonLink>,
		)

		cy.get('button').click()

		cy.get('@onClick').should('have.been.calledOnce')
	})

	it('closes the menu on a link click at mobile width', () => {
		const onMenuItemClick = cy.stub().as('onMenuItemClick')
		cy.viewport(MOBILE_WIDTH, 800)
		mountLink({ onMenuItemClick })

		cy.get('a').click()

		cy.get('@onMenuItemClick').should('have.been.calledOnce')
	})

	it('leaves the menu alone on a link click at desktop width', () => {
		const onMenuItemClick = cy.stub().as('onMenuItemClick')
		cy.viewport(DESKTOP_WIDTH, 800)
		mountLink({ onMenuItemClick })

		cy.get('a').click()

		cy.get('@onMenuItemClick').should('not.have.been.called')
	})

	it('does not close the menu for a button, even at mobile width', () => {
		const onMenuItemClick = cy.stub().as('onMenuItemClick')
		cy.viewport(MOBILE_WIDTH, 800)
		cy.mount(
			<NavMenuButtonLink onMenuItemClick={onMenuItemClick}>
				Logout
			</NavMenuButtonLink>,
		)

		cy.get('button').click()

		cy.get('@onMenuItemClick').should('not.have.been.called')
	})

	it('takes focus when it is in an error state', () => {
		cy.mount(<NavMenuButtonLink isError>Logout</NavMenuButtonLink>)

		cy.get('button').should('have.focus')
	})

	it('cannot be activated when disabled', () => {
		cy.mount(<NavMenuButtonLink isDisabled>Logout</NavMenuButtonLink>)

		cy.get('button').should('be.disabled')
	})

	it('has no axe violations', () => {
		mountLink()

		cy.get('a').should('exist')
		cy.checkA11y()
	})
})
