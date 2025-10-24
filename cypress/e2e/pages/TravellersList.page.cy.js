import { DATABASE } from '../../support/constants/api/database'
import { dialog } from '../../support/constants/dialog'
import { PAGE_SELECTORS } from '../../support/constants/selectors/pages'
import { travellersListSelectors } from '../../support/constants/selectors/components'
import { BASE_URL, APP_URLS } from '../../support/constants/api/urls'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL + APP_URLS.CY_AUTHENTICATION

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

		it('should render the travellers list component', () => {
			performLogin()

			cy.get(travellersListSelectors.travellersListContainer).should(
				'be.visible',
			)

			cy.get(travellersListSelectors.travellersListContainer).within(
				() => {
					cy.get('section').should('exist')
					cy.get(travellersListSelectors.controls).should('exist')
				},
			)
		})
	})

	describe('Authentication & User States', () => {
		it('should show register button when user is logged in and not a traveller', () => {
			performLogin()

			cy.get(travellersListSelectors.registerButton).should('be.visible')
			cy.get(travellersListSelectors.registerButton).should(
				'contain',
				'Register as a Traveller',
			)
		})

		// TOOO: Update when traveller user is available
		// it('should not show register button when user is logged in and is a traveller', () => {})

		it('should navigate to register page when register button is clicked', () => {
			performLogin()

			cy.get(travellersListSelectors.registerButton).click()
			cy.url().should('include', '/register')
		})
	})

	describe('Data Loading & API Integration', () => {
		it('should load travellers on initial page visit', () => {
			performLogin()

			// Should show loading state initially
			cy.get(dialog.spinnerContainer).should('be.visible')

			// Wait for loading to complete
			cy.get(dialog.spinnerContainer).should('not.exist')

			// Should show either travellers list or no travellers message
			cy.get('body').then(($body) => {
				if (
					$body.find(travellersListSelectors.travellersList).length >
					0
				) {
					cy.get(travellersListSelectors.travellersList).should(
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
			cy.get(dialog.spinnerContainer).should('not.exist')

			// Click refresh if button is available
			cy.get('body').then(($body) => {
				const refreshButton = $body.find('button:contains("Refresh")')
				if (
					refreshButton.length > 0 &&
					!refreshButton.is(':disabled')
				) {
					cy.wrap(refreshButton).click()

					// Should show loading again
					cy.get(dialog.spinnerContainer).should('be.visible')

					// Wait for refresh to complete
					cy.get(dialog.spinnerContainer).should('not.exist')
				}
			})
		})

		it('should disable refresh button when no travellers exist', () => {
			performLogin()

			// Wait for loading to complete
			cy.get(dialog.spinnerContainer).should('not.exist')

			// If no travellers message is shown, refresh button should be disabled
			cy.get('body').then(($body) => {
				if (
					$body.find('h3:contains("No travellers listed.")').length >
					0
				) {
					cy.get('button:contains("Refresh")').should('be.disabled')
				}
			})
		})
	})

	describe('Error Handling', () => {
		it('should display server error dialog when API returns 500 status', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Internal Server Error' },
			}).as('getTravellers500Error')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellers500Error')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'The server is currently experiencing issues. Please try again later.',
			)
		})

		it('should display not found error dialog when API returns 404 status', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 404,
				body: { message: 'Not Found' },
			}).as('getTravellers404Error')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellers404Error')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'Travellers data not found. Please contact support.',
			)
		})

		it('should display client error dialog when API returns 400-499 status', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 403,
				body: { message: 'Forbidden' },
			}).as('getTravellers403Error')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellers403Error')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'There was a problem with your request. Please try again.',
			)
		})

		it('should display connection error dialog when API returns other error status', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 502,
				body: { message: 'Bad Gateway' },
			}).as('getTravellers502Error')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellers502Error')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'Unable to load travellers. Please check your connection and try again.',
			)
		})

		it('should display network error dialog when network fails', () => {
			cy.intercept('GET', '**/travellers.json', {
				forceNetworkError: true,
			}).as('getTravellersNetworkError')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersNetworkError')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'Unable to connect to the server. Please check your internet connection.',
			)
		})

		it('should display generic error for unexpected errors', () => {
			// Mock a malformed response that would cause JSON parsing to fail
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 200,
				body: 'invalid json response',
				headers: {
					'content-type': 'application/json',
				},
			}).as('getTravellersInvalidJSON')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersInvalidJSON')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'An unexpected error occurred while loading travellers. Please try again.',
			)
		})

		it('should close error dialog when close button is clicked', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Server error' },
			}).as('getTravellersError')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersError')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)

			// Click the close button (you may need to adjust the selector based on your BaseDialog implementation)
			cy.get('[data-cy="travellers-list-error-dialog"]').within(() => {
				cy.get('button').contains('Close').click()
			})

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'not.exist',
			)
		})

		it('should allow retry after error by clicking refresh button', () => {
			// Start with fixture data so refresh button is enabled
			cy.intercept('GET', '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersInitialSuccess')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersInitialSuccess')

			// Verify refresh button is enabled and travellers are displayed
			cy.get('button').contains('Refresh').should('not.be.disabled')
			cy.get(travellersListSelectors.travellersList).should('be.visible')

			// Simulate error on manual refresh
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Server error' },
			}).as('getTravellersRefreshError')

			cy.get('button').contains('Refresh').click()
			cy.wait('@getTravellersRefreshError')

			// Close error dialog
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').within(() => {
				cy.get('button').contains('Close').click()
			})

			// Setup successful retry
			cy.intercept('GET', '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersRetrySuccess')

			// Button should still be enabled since we had initial data
			cy.get('button').contains('Refresh').should('not.be.disabled')
			cy.get('button').contains('Refresh').click()
			cy.wait('@getTravellersRetrySuccess')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'not.exist',
			)
			cy.get(travellersListSelectors.travellersList).should('be.visible')
		})

		it('should handle timeout errors appropriately', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 504, // Gateway Timeout
				body: { message: 'Gateway Timeout' },
				delay: 2000,
			}).as('getTravellersTimeout')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersTimeout')

			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'be.visible',
			)
			cy.get('[data-cy="travellers-list-error-dialog"]').should(
				'contain',
				'Unable to load travellers. Please check your connection and try again.',
			)
		})
	})

	describe('Loading States', () => {
		it('should show loading spinner during initial load', () => {
			cy.intercept('GET', '**/travellers.json', {
				fixture: 'travellers.json',
				delay: 1000,
			}).as('getTravellersWithDelay')

			performLogin()
			cy.visit('/travellers')

			cy.get(dialog.spinnerContainer).should('be.visible')
			cy.wait('@getTravellersWithDelay')
			cy.get(dialog.spinnerContainer).should('not.exist')
		})

		it('should hide content while loading', () => {
			cy.intercept('GET', '**/travellers.json', {
				fixture: 'travellers.json',
				delay: 500,
			}).as('getTravellersWithDelay')

			performLogin()
			cy.visit('/travellers')

			cy.get(dialog.spinnerContainer).should('be.visible')
			cy.get(travellersListSelectors.travellersList).should('not.exist')
			cy.contains('No travellers listed.').should('not.exist')

			cy.wait('@getTravellersWithDelay')
			cy.get(dialog.spinnerContainer).should('not.exist')
		})
	})

	describe('Content Display', () => {
		it('should display travellers list when travellers exist', () => {
			cy.intercept(DATABASE.GET, '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersSuccess')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersSuccess')

			cy.get(travellersListSelectors.travellersList).should('be.visible')
			cy.get(travellersListSelectors.travellerItem).should('exist')
		})

		it('should display no travellers message when list is empty', () => {
			cy.intercept(DATABASE.GET, '**/travellers.json', {
				statusCode: 200,
				body: {},
			}).as('getTravellersEmpty')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersEmpty')

			cy.contains('No travellers listed.').should('be.visible')
			cy.get(travellersListSelectors.travellersList).should('not.exist')
		})
	})
})
