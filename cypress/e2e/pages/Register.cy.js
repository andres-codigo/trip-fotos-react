import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import {
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	DIALOG_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	COMBOBOX_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { VALIDATION_MESSAGES } from '../../../src/constants/validation'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '../../../src/constants/travellers'
import { API_DATABASE } from '../../../src/constants/api'
import { ERROR_MESSAGES } from '../../../src/constants/errors'
import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'

import { TEST_USERS } from '../../../src/constants/config/users'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION
const REQUEST_TIMEOUT = 10000

describe('Register Page', () => {
	let uploadedImageUrl

	beforeEach(() => {
		cy.resetEmulators()
		cy.visit(loginUrl)
		performLogin()
		cy.visit(PATHS.REGISTER)
	})

	// afterEach rather than the test body, so the image is removed even when a later assertion fails
	afterEach(() => {
		if (uploadedImageUrl) {
			cy.deleteStorageObject(uploadedImageUrl)
			uploadedImageUrl = undefined
		}
	})

	it('renders the register page container', () => {
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).should('be.visible')
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).within(() => {
			cy.get('h1').should('contain', 'Register')
		})
	})

	it('has no axe violations', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('be.visible')

		cy.checkA11y()
	})

	it('renders the traveller registration form', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
		).should('be.visible')
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).should('be.visible')
		cy.get(COMBOBOX_SELECTORS.INPUT).should('be.visible')
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
		cy.contains(VALIDATION_MESSAGES.TRIP_DESCRIPTION_REQUIRED).should(
			'be.visible',
		)
		cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('be.visible')
		cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('be.visible')
	})

	it('successfully registers a traveller', () => {
		const { firstName, lastName, tripDescription, daysInCity } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// Intercept the registration API call
		cy.stubLiveOnly(API_DATABASE.PUT, '**/travellers/*.json*', {
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
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
		).type(tripDescription)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).type(daysInCity)

		// Choose a city through the (stubbed) city search
		cy.selectCity()

		// Submit the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		// Wait for API call
		cy.wait('@registerTraveller', { timeout: REQUEST_TIMEOUT })

		// Verify redirection to Travellers page
		cy.url({ timeout: REQUEST_TIMEOUT }).should('include', PATHS.TRAVELLERS)

		// Verify success alert message
		cy.get('[role="alert"]')
			.should('be.visible')
			.and('contain', TRAVELLER_REGISTRATION_SUCCESS_MESSAGE)
		cy.assertTravellerPersisted(TEST_USERS.STANDARD.ID, {
			firstName,
			lastName,
		})
	})

	it('registers a traveller with a photo uploaded to Storage', () => {
		const { firstName, lastName, tripDescription, daysInCity } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// A real Storage upload, live or emulated (deleted in afterEach); the DB write is stubbed
		cy.intercept('POST', '**/v0/b/*/o*').as('uploadImage')
		cy.stubLiveOnly(API_DATABASE.PUT, '**/travellers/*.json*', {
			statusCode: 200,
			body: {
				...MOCK_TRAVELLERS.NEW_TRAVELLER,
				registered: new Date().toISOString(),
			},
		}).as('registerTraveller')

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
			firstName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
			lastName,
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
		).type(tripDescription)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).type(daysInCity)
		cy.selectCity()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			'cypress/fixtures/test-image.png',
			{ force: true },
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 1)

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		cy.wait('@uploadImage', { timeout: REQUEST_TIMEOUT })
		cy.wait('@registerTraveller', { timeout: REQUEST_TIMEOUT })
			.its('request.body')
			.then((body) => {
				expect(body.fileDimensions).to.have.length(body.files.length)
				expect(body.fileDimensions[0].width).to.be.greaterThan(0)
				expect(body.fileDimensions[0].height).to.be.greaterThan(0)
			})
			.its('files')
			.should('have.length', 1)
			.its('0')
			.should('include', '/v0/b/')
			.then((url) => {
				uploadedImageUrl = url
			})

		cy.url({ timeout: REQUEST_TIMEOUT }).should('include', PATHS.TRAVELLERS)
		cy.assertTravellerPersisted(TEST_USERS.STANDARD.ID, {
			firstName,
			lastName,
		})
	})

	it('shows a loading dialog while registering', () => {
		const { firstName, lastName, tripDescription, daysInCity } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// Intercept with delay
		cy.intercept(API_DATABASE.PUT, '**/travellers/*.json*', {
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
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
		).type(tripDescription)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
		).type(daysInCity)

		// Choose a city through the (stubbed) city search
		cy.selectCity()

		// Submit the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		// Check for loading dialog
		cy.get(DIALOG_SELECTORS.REGISTERING, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
		cy.get(DIALOG_SELECTORS.REGISTERING).within(() => {
			cy.get(DIALOG_SELECTORS.TITLE).should('contain', 'Registering')
			cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('exist')
		})

		cy.wait('@registerTravellerDelayed', { timeout: REQUEST_TIMEOUT })
	})

	describe('Error Handling', () => {
		it('shows an error dialog when registration fails', () => {
			const { firstName, lastName, tripDescription, daysInCity } =
				MOCK_TRAVELLERS.NEW_TRAVELLER

			// Intercept failure
			cy.intercept(API_DATABASE.PUT, '**/travellers/*.json*', {
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
				TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
			).type(tripDescription)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type(daysInCity)

			// Choose a city through the (stubbed) city search
			cy.selectCity()

			// Submit the form
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.wait('@registerTravellerFailed', { timeout: REQUEST_TIMEOUT })

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
						ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER,
					).should('exist')
					// Close the dialog
					cy.get(DIALOG_SELECTORS.CLOSE_BUTTON).click()
				},
			)

			// Ensure dialog is closed
			cy.get(DIALOG_SELECTORS.INVALID_TRAVELLER_REGISTRATION).should(
				'not.exist',
			)
		})
	})
})
