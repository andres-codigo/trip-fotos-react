import { PATHS } from '../../../src/constants/ui/paths'
import { TRAVELLERS_LIST_SELECTORS } from '../../../src/constants/test/selectors/components'

/**
 * Navigates to the traveller registration page
 * Waits for the register link to be active (have href) before clicking
 * Verifies successful navigation to the register route
 */
export const navigateToRegisterPage = () => {
	// Wait for the element to have the 'href' attribute.
	// This implicitly waits for the loading state to finish (where it is a <span>)
	// and transforms into an <a> tag.
	cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('have.attr', 'href')

	// Re-select the element to ensure the subject is the DOM element, not the attribute string
	// This prevents the "Subject received was: /register" error
	cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).click()

	// Verify navigation
	cy.url({ timeout: 10000 }).should('include', PATHS.REGISTER)
}
