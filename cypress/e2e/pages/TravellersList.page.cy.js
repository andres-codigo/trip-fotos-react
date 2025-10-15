import {
	pageSelectors,
	travellersListSelectors,
} from '../../support/constants/selectors'
import { baseUrl, urls } from '../../support/constants/urls'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = baseUrl + urls.cyAuth

describe('Travellers Page - WIP', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	it('should display the travellers page', () => {
		performLogin()

		// Basic visibility test
		cy.get(pageSelectors.mainContainer).should('be.visible')
		cy.get(pageSelectors.travellersPage).should('exist')
	})

	it('should render the travellers list component', () => {
		performLogin()

		// Basic test that the main travellers list container exists
		cy.get(travellersListSelectors.travellersListContainer).should(
			'be.visible',
		)

		// Basic test that the BaseCard component is rendered
		cy.get(travellersListSelectors.travellersListContainer).within(() => {
			cy.get('section').should('exist')
			cy.get('.controls').should('exist')
		})
	})

	// TODO: Add tests for:
	// - Loading states
	// - Error handling
	// - User interactions with travellers list
	// - Navigation between travellers
	// - Search/filter functionality
	// - Responsive design
})
