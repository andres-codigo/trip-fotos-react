import { apiDatabase } from '../../support/constants/api'
import { dialog } from '../../support/constants/dialog'
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

	describe.only('Basic Rendering', () => {
		it('should display the travellers page', () => {
			performLogin()

			cy.get(pageSelectors.mainContainer).should('be.visible')
			cy.get(pageSelectors.travellersPage).should('exist')
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

	describe.skip('Authentication & User States', () => {
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

	describe.skip('Data Loading & API Integration', () => {
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

	describe.skip('Error Handling', () => {
		it('should display error dialog when API call fails', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Server error' },
			}).as('getTravellersError')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersError')

			cy.get('[role="alertdialog"]').should('be.visible')
			cy.get('[role="alertdialog"]').should('contain', 'Error')
		})

		it('should close error dialog when close button is clicked', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: { message: 'Test error message' },
			}).as('getTravellersError')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersError')

			cy.get('[role="alertdialog"]').should('be.visible')
			cy.get('[role="alertdialog"]').within(() => {
				cy.contains('Close').click()
			})
			cy.get('[role="alertdialog"]').should('not.exist')
		})

		it('should show generic error message when API returns error without message', () => {
			cy.intercept('GET', '**/travellers.json', {
				statusCode: 500,
				body: {},
			}).as('getTravellersGenericError')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersGenericError')

			cy.get('[role="alertdialog"]').should('be.visible')
			cy.get('[role="alertdialog"]').should(
				'contain',
				'Something went wrong!',
			)
		})
	})

	describe.skip('Loading States', () => {
		it('should show loading spinner during initial load', () => {
			cy.intercept(apiDatabase.GET, '**/travellers.json', (req) => {
				req.reply((res) => {
					setTimeout(
						() => res.send({ fixture: 'travellers.json' }),
						1000,
					)
				})
			}).as('getTravellersWithDelay')

			performLogin()
			cy.visit('/travellers')

			cy.get(dialog.spinnerContainer).should('be.visible')
			cy.wait('@getTravellersWithDelay')
			cy.get(dialog.spinnerContainer).should('not.exist')
		})

		it('should hide content while loading', () => {
			cy.intercept(apiDatabase.GET, '**/travellers.json', (req) => {
				req.reply((res) => {
					setTimeout(
						() => res.send({ fixture: 'travellers.json' }),
						500,
					)
				})
			}).as('getTravellersWithDelay')

			performLogin()
			cy.visit('/travellers')

			cy.get(dialog.spinnerContainer).should('be.visible')
			cy.get(travellersListSelectors.travellersList).should('not.exist')
			cy.contains('No travellers listed.').should('not.exist')

			cy.wait('@getTravellersWithDelay')
		})
	})

	describe.skip('Content Display', () => {
		it('should display travellers list when travellers exist', () => {
			cy.intercept(apiDatabase.GET, '**/travellers.json', {
				fixture: 'travellers.json',
			}).as('getTravellersSuccess')

			performLogin()
			cy.visit('/travellers')
			cy.wait('@getTravellersSuccess')

			cy.get(travellersListSelectors.travellersList).should('be.visible')
			cy.get(travellersListSelectors.travellerItem).should('exist')
		})

		it('should display no travellers message when list is empty', () => {
			cy.intercept(apiDatabase.GET, '**/travellers.json', {
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
