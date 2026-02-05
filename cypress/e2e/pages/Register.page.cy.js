import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import {
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	DIALOG_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { VALIDATION_MESSAGES } from '../../../src/constants/validation/messages'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '../../../src/constants/travellers'
import { API_DATABASE, API_ERROR_MESSAGE } from '../../../src/constants/api'
import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION

describe('Register Page', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
		performLogin()
		cy.visit(PATHS.REGISTER)
	})

	it('renders the register page container', () => {
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).should('be.visible')
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).within(() => {
			cy.get('h2').should('contain', 'Register')
		})
	})

	it('renders the traveller registration form', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT).should(
			'be.visible',
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.CHECKBOX_TOKYO)
			.parent()
			.should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).should(
			'be.visible',
		)
	})

	it('shows validation errors on empty submit', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()
		cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should(
			'be.visible',
		)
		cy.contains(VALIDATION_MESSAGES.LAST_NAME_REQUIRED).should('be.visible')
		cy.contains(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED).should(
			'be.visible',
		)
		cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('be.visible')
		cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('be.visible')
	})

	it('successfully registers a traveller', () => {
		const { firstName, lastName, description, daysInCity, cities } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// Intercept the registration API call
		cy.intercept(API_DATABASE.PUT, '**/travellers/*.json?auth=*', {
			statusCode: 200,
			body: {
				...MOCK_TRAVELLERS.NEW_TRAVELLER,
				registered: new Date().toISOString(),
			},
		}).as('registerTraveller')

		// Fill in the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
			firstName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
			lastName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT).type(
			description,
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).type(daysInCity)

		// Check the cities checkboxes
		cities.forEach((city) => {
			const checkboxSelector = `checkbox-${city}`
			cy.get(`[data-cy="${checkboxSelector}"]`).siblings('label').click()
		})

		// Submit the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		// Wait for API call
		cy.wait('@registerTraveller')

		// Verify redirection to Travellers page
		cy.url().should('include', PATHS.TRAVELLERS)

		// Verify success alert message
		cy.get('[role="alert"]')
			.should('be.visible')
			.and('contain', TRAVELLER_REGISTRATION_SUCCESS_MESSAGE)
	})

	it('shows a loading dialog while registering', () => {
		const { firstName, lastName, description, daysInCity, cities } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// Intercept with delay
		cy.intercept(API_DATABASE.PUT, '**/travellers/*.json?auth=*', {
			delay: 1000,
			statusCode: 200,
			body: {
				...MOCK_TRAVELLERS.NEW_TRAVELLER,
				registered: new Date().toISOString(),
			},
		}).as('registerTravellerDelayed')

		// Fill in the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
			firstName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
			lastName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT).type(
			description,
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).type(daysInCity)

		// Check the cities checkboxes
		cities.forEach((city) => {
			const checkboxSelector = `checkbox-${city}`
			cy.get(`[data-cy="${checkboxSelector}"]`).siblings('label').click()
		})

		// Submit the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		// Check for loading dialog
		cy.get(DIALOG_SELECTORS.REGISTERING).should('be.visible')
		cy.get(DIALOG_SELECTORS.REGISTERING).within(() => {
			cy.get(DIALOG_SELECTORS.TITLE).should('contain', 'Registering')
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('exist')
		})

		cy.wait('@registerTravellerDelayed')
	})

	describe('Error Handling', () => {
		it('shows an error dialog when registration fails', () => {
			const { firstName, lastName, description, daysInCity, cities } =
				MOCK_TRAVELLERS.NEW_TRAVELLER

			// Intercept failure
			cy.intercept(API_DATABASE.PUT, '**/travellers/*.json?auth=*', {
				statusCode: 500,
				body: { error: 'Internal Server Error' },
			}).as('registerTravellerFailed')

			// Fill in the form
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
				firstName,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
				lastName,
			)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT,
			).type(description)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type(daysInCity)

			// Check the cities checkboxes
			cities.forEach((city) => {
				const checkboxSelector = `checkbox-${city}`
				cy.get(`[data-cy="${checkboxSelector}"]`)
					.siblings('label')
					.click()
			})

			// Submit the form
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.wait('@registerTravellerFailed')

			// Check for error dialog
			cy.get(DIALOG_SELECTORS.INVALID_TRAVELLER_REGISTRATION).should(
				'be.visible',
			)
			cy.get(DIALOG_SELECTORS.INVALID_TRAVELLER_REGISTRATION).within(
				() => {
					cy.get(DIALOG_SELECTORS.TITLE).should(
						'contain',
						DIALOG_SELECTORS.MESSAGES.ERROR.TITLE,
					)
					cy.contains(
						API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH,
					).should('exist')
					// Close the dialog
					cy.get('footer > button').click()
				},
			)

			// Ensure dialog is closed
			cy.get(DIALOG_SELECTORS.INVALID_TRAVELLER_REGISTRATION).should(
				'not.exist',
			)
		})
	})
})
