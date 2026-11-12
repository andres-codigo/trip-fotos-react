import { ERROR_SUMMARY_SELECTORS } from '@/constants/test'

import ErrorSummary from '@/components/ui/form/error-summary/ErrorSummary'

const ERRORS = [
	{ id: 'first-name', message: 'Enter your first name' },
	{ id: 'last-name', message: 'Enter your last name' },
]

const Form = () => (
	<form className="flex flex-col gap-4">
		<ErrorSummary errors={ERRORS} />
		<label htmlFor="first-name">First name</label>
		<input id="first-name" />
		<label htmlFor="last-name">Last name</label>
		<input id="last-name" />
	</form>
)

describe('<ErrorSummary />', () => {
	it('has no axe violations', () => {
		cy.mount(<Form />)
		cy.get(ERROR_SUMMARY_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('focuses the field when its link is clicked', () => {
		cy.mount(<Form />)
		cy.get(ERROR_SUMMARY_SELECTORS.LINK).eq(1).click()
		cy.focused().should('have.id', 'last-name')
		cy.location('hash').should('eq', '')
	})

	it('draws a 2px edge in the danger colour', () => {
		cy.mount(<Form />)
		cy.get(ERROR_SUMMARY_SELECTORS.LINK)
			.first()
			.then(($link) => {
				const danger = getComputedStyle($link[0]).color
				cy.get(ERROR_SUMMARY_SELECTORS.ROOT)
					.should('have.css', 'border-top-width', '2px')
					.and('have.css', 'border-top-style', 'solid')
					.and('have.css', 'border-top-color', danger)
			})
	})
})
