import { MemoryRouter } from 'react-router-dom'

import NavMenuButtonLink from '@/components/layout/main-nav/nav-menu/NavMenuButtonLink'

const mountLink = (props = {}) =>
	cy.mount(
		<MemoryRouter>
			<nav
				aria-label="Main"
				className="flex h-20 bg-header">
				<NavMenuButtonLink
					to="/travellers"
					{...props}>
					Travellers
				</NavMenuButtonLink>
			</nav>
		</MemoryRouter>,
	)

describe('<NavMenuButtonLink />', () => {
	it('fills the header height', () => {
		mountLink()

		cy.get('a').invoke('outerHeight').should('eq', 80)
	})

	it('draws a 3px bar under the current page only', () => {
		mountLink({ isActive: true })

		cy.get('a')
			.should('have.attr', 'aria-current', 'page')
			.then(($link) => {
				const bar = getComputedStyle($link[0], '::after')
				expect(bar.height).to.equal('3px')
				expect(bar.bottom).to.equal('0px')
			})
	})

	it('draws no bar when not current', () => {
		mountLink()

		cy.get('a').then(($link) => {
			expect(getComputedStyle($link[0], '::after').content).to.equal(
				'none',
			)
		})
	})

	it('draws the focus ring inside the link, so it clears the header edge', () => {
		mountLink()

		cy.get('a').focus()
		cy.focused()
			.should('have.css', 'outline-style', 'solid')
			.and('have.css', 'outline-offset', '-3px')
	})

	it('has no axe violations', () => {
		mountLink({ isActive: true })

		cy.checkA11y()
	})
})
