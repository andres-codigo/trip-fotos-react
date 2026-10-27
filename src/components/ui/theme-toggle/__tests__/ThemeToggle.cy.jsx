import { THEME } from '@/constants/ui'
import { THEME_TOGGLE } from '@/constants/test'

import ThemeToggle from '@/components/ui/theme-toggle/ThemeToggle'

const option = (mode) => cy.get(`[data-cy="${THEME_TOGGLE.OPTION(mode)}"]`)

describe('<ThemeToggle />', () => {
	beforeEach(() => {
		cy.window().then((win) =>
			win.localStorage.removeItem(THEME.STORAGE_KEY),
		)
		cy.mount(<ThemeToggle />)
	})

	it('selects Dark, applies it to the page and remembers it', () => {
		option('dark').check({ force: true })

		cy.document()
			.its('documentElement')
			.should('have.attr', THEME.ATTRIBUTE, 'dark')
		cy.window().then((win) =>
			expect(win.localStorage.getItem(THEME.STORAGE_KEY)).to.eq('dark'),
		)
	})

	it('moves between options with the arrow keys', () => {
		option('light').check({ force: true }).focus().type('{rightarrow}')

		option('dark').should('be.checked')
	})

	it('shows a focus ring on the keyboard-focused option', () => {
		option('system').focus()

		cy.get('label[for="theme-mode-system"]').should(
			'have.css',
			'outline-style',
			'solid',
		)
	})

	it('has no accessibility violations in either theme', () => {
		cy.checkA11y()
		option('dark').check({ force: true })
		cy.checkA11y()
	})
})
