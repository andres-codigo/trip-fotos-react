import { API_DATABASE } from '../../../src/constants/api'
import {
	TRAVELLERS_LIST_SELECTORS,
	DIALOG_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { ERROR_MESSAGES } from '../../../src/constants/errors'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION
describe('Travellers Page - WIP', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	describe('Basic Rendering', () => {
		it('should display the travellers page', () => {
			performLogin()

			cy.get(PAGE_SELECTORS.MAIN_CONTAINER).should('be.visible')
			cy.get(PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER).should('exist')
		})

		/* TODO: revisit once travellers are implemented via registration*/
		it.skip('should render the travellers list component', () => {
			performLogin()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'be.visible',
			)

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).within(() => {
				cy.get(TRAVELLERS_LIST_SELECTORS.CONTROLS).should('exist')
			})
		})
	})

	describe('Authentication & User States', () => {
		it('should show register link when user is logged in and not a traveller', () => {
			performLogin()

			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('be.visible')
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should(
				'contain',
				'Register',
			)
		})

		// TODO: Update when traveller user is available
		// it('should not show register link when user is logged in and is a traveller', () => {})

		it('should navigate to register page when register link is clicked', () => {
			performLogin()
			cy.visit(PATHS.TRAVELLERS)

			// Wait for initial loading to complete so button is enabled
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')

			// Ensure the link is enabled (not aria-disabled) before clicking
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK)
				.should('not.have.attr', 'aria-disabled', 'true')
				.click()

			// Wait for redirect
			cy.url({ timeout: 10000 }).should('include', PATHS.REGISTER)
		})
	})

	describe('Data Loading & API Integration', () => {
		it('should disable register link when loading', () => {
			performLogin()

			// Should show loading state initially
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('be.visible')

			// Register link should be visible but disabled (aria-disabled="true")
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK)
				.should('be.visible')
				.and('have.attr', 'aria-disabled', 'true')
		})

		it('should load travellers on initial page visit', () => {
			performLogin()

			// Should show loading state initially
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('be.visible')

			// Wait for loading to complete
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')

			// Should show either travellers list or no travellers message
			cy.get('body').then(($body) => {
				if (
					$body.find(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST)
						.length > 0
				) {
					cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
						'be.visible',
					)
				} else {
					cy.contains('No travellers listed.').should('be.visible')
				}
			})
		})

		it('should refresh travellers when refresh button is clicked', () => {
			performLogin()

			// Wait for initial load
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')

			// Click refresh if button is available
			cy.get('body').then(($body) => {
				const refreshButton = $body.find('button:contains("Refresh")')
				if (
					refreshButton.length > 0 &&
					!refreshButton.is(':disabled')
				) {
					cy.wrap(refreshButton).click()

					// Should show loading again
					cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should(
						'be.visible',
					)

					// Wait for refresh to complete
					cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should(
						'not.exist',
					)
				}
			})
		})

		it('should show refresh button when no travellers exist', () => {
			performLogin()

			// Wait for loading to complete
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')

			// If no travellers message is shown, refresh button should exist and be enabled
			cy.get('body').then(($body) => {
				if (
					$body.find('h3:contains("No travellers listed.")').length >
					0
				) {
					cy.get('button:contains("Refresh")')
						.should('exist')
						.and('not.be.disabled')
				}
			})
		})
	})

	describe('Error Handling', () => {
		it('should display server error dialog when API returns 500 status', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Internal Server Error' },
			}).as('getTravellers500Error')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellers500Error')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).within(() => {
				cy.get(DIALOG_SELECTORS.TITLE).should(
					'contain',
					DIALOG_SELECTORS.MESSAGES.ERROR.TITLE,
				)
				cy.contains(ERROR_MESSAGES.REQUEST_ERROR).should('exist')
				// Close the dialog
				cy.get('footer > button').click()
			})
		})

		it('should display client error dialog when API returns 400-499 status', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 403,
				body: { message: 'Forbidden' },
			}).as('getTravellers403Error')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellers403Error')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should(
				'contain',
				ERROR_MESSAGES.REQUEST_ERROR,
			)
		})

		it('should display network error dialog when network fails', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				forceNetworkError: true,
			}).as('getTravellersNetworkError')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersNetworkError')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should(
				'contain',
				ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
			)
		})

		it('should display generic error for unexpected errors', () => {
			// Mock a malformed response that would cause JSON parsing to fail
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 200,
				body: 'invalid json response',
				headers: {
					'content-type': 'application/json',
				},
			}).as('getTravellersInvalidJSON')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersInvalidJSON')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should(
				'contain',
				ERROR_MESSAGES.UNEXPECTED_ERROR,
			)
		})

		it('should close error dialog when close button is clicked', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Server error' },
			}).as('getTravellersError')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersError')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')

			// Click the close button (you may need to adjust the selector based on your BaseDialog implementation)
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).within(() => {
				cy.get('button').contains('Close').click()
			})

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('not.exist')
		})

		it('should allow retry after error by clicking refresh button', () => {
			// Start with fixture data so refresh button is enabled
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersInitialSuccess')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersInitialSuccess')

			// Verify refresh button is enabled and travellers are displayed
			cy.get('button').contains('Refresh').should('not.be.disabled')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'be.visible',
			)

			// Simulate error on manual refresh
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Server error' },
			}).as('getTravellersRefreshError')

			cy.get('button').contains('Refresh').click()
			cy.wait('@getTravellersRefreshError')

			// Close error dialog
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).within(() => {
				cy.get('button').contains('Close').click()
			})

			// Setup successful retry
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersRetrySuccess')

			// Button should still be enabled since we had initial data
			cy.get('button').contains('Refresh').should('not.be.disabled')
			cy.get('button').contains('Refresh').click()
			cy.wait('@getTravellersRetrySuccess')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'be.visible',
			)
		})
	})

	describe('Loading States', () => {
		it('should show loading spinner during initial load', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
				delay: 1000,
			}).as('getTravellersWithDelay')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)

			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('be.visible')
			cy.wait('@getTravellersWithDelay')
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')
		})

		it('should hide content while loading', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
				delay: 500,
			}).as('getTravellersWithDelay2')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)

			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('be.visible')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'not.exist',
			)
			cy.contains('No travellers listed.').should('not.exist')

			cy.wait('@getTravellersWithDelay2')
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('not.exist')
		})
	})

	describe('Content Display', () => {
		it('should display travellers list when travellers exist', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersSuccess')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersSuccess')

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'be.visible',
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
		})

		it('should display no travellers message when list is empty', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json', {
				statusCode: 200,
				body: {},
			}).as('getTravellersEmpty')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersEmpty')

			cy.contains('No travellers listed.').should('be.visible')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'not.exist',
			)
		})
	})
})
