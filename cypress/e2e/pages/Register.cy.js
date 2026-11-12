import {
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	FILE_UPLOADER_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { GLOBAL } from '../../../src/constants/ui/global'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '../../../src/constants/travellers'
import { API_DATABASE } from '../../../src/constants/api'
import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'

import { TEST_USERS } from '../../../src/constants/config/users'

import { performLogin } from '../../support/utils/authHelpers'
import { atPath } from '../../support/utils/waitForSuccess'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION
const REQUEST_TIMEOUT = 10000

describe('Register Page', () => {
	let uploadedImageUrls = []

	beforeEach(() => {
		cy.resetEmulators()
		cy.visit(loginUrl)
		performLogin()
		cy.visit(PATHS.REGISTER)
	})

	// afterEach rather than the test body, so the image is removed even when a later assertion fails
	afterEach(() => {
		uploadedImageUrls.forEach((url) => cy.deleteStorageObject(url))
		uploadedImageUrls = []
	})

	it('has no axe violations', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('be.visible')

		cy.checkA11y()
	})

	it('successfully registers a traveller', () => {
		const { firstName, lastName, tripDescription, tripStart, tripEnd } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// Intercept the registration API call
		cy.intercept(API_DATABASE.PUT, '**/travellers/*.json*').as(
			'registerTraveller',
		)

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
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
			tripStart,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
			tripEnd,
		)

		// Choose a city through the (stubbed) city search
		cy.selectCity()

		// Submit the form
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		// Wait for API call
		cy.wait('@registerTraveller', { timeout: REQUEST_TIMEOUT })

		// Verify redirection to Travellers page
		cy.waitForSuccess(atPath(PATHS.TRAVELLERS))

		// Verify success alert message
		cy.get('[role="alert"]')
			.should('be.visible')
			.and('contain', TRAVELLER_REGISTRATION_SUCCESS_MESSAGE)
		cy.assertTravellerPersisted(TEST_USERS.STANDARD.ID, {
			firstName,
			lastName,
			tripStart,
			tripEnd,
		})
	})

	it('registers a traveller with a photo uploaded to Storage', () => {
		const { firstName, lastName, tripDescription, tripStart, tripEnd } =
			MOCK_TRAVELLERS.NEW_TRAVELLER

		// A real Storage upload to the emulator (deleted in afterEach), not spied on: an intercepted upload stores an image the browser cannot show
		cy.intercept(API_DATABASE.PUT, '**/travellers/*.json*').as(
			'registerTraveller',
		)

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
			firstName,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
			lastName,
		)
		cy.get(
			TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
		).type(tripDescription)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
			tripStart,
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
			tripEnd,
		)
		cy.selectCity()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			'cypress/fixtures/test-image.png',
			{ force: true },
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 1)

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

		cy.wait('@registerTraveller', { timeout: REQUEST_TIMEOUT })
			.its('request.body')
			.then((body) => {
				expect(body.fileDimensions).to.have.length(body.files.length)
				expect(body.fileDimensions[0].width).to.be.greaterThan(0)
				expect(body.fileDimensions[0].height).to.be.greaterThan(0)
				expect(body.fileThumbnails).to.have.length(body.files.length)
				expect(
					body.fileThumbnails[0].map(({ width }) => width),
				).to.deep.equal([...GLOBAL.IMAGE_THUMBNAIL_WIDTHS])
				body.fileThumbnails[0].forEach(({ url }) => {
					expect(url).to.include('/v0/b/')
					uploadedImageUrls.push(url)
				})
			})
			.its('files')
			.should('have.length', 1)
			.its('0')
			.should('include', '/v0/b/')
			.then((url) => {
				uploadedImageUrls.push(url)
			})

		cy.waitForSuccess(atPath(PATHS.TRAVELLERS))
		cy.assertTravellerPersisted(TEST_USERS.STANDARD.ID, {
			firstName,
			lastName,
		})
	})
})

// Talks to the emulator directly, as a script could, so a pass proves the rules and not just the form
describe('Traveller trip dates database rules', () => {
	const save = (body) =>
		cy.window().then((win) =>
			cy.request({
				method: API_DATABASE.PUT,
				url: `${Cypress.expose('VITE_DATABASE_URL')}/travellers/${win.localStorage.getItem('userId')}.json`,
				qs: {
					ns: Cypress.expose('VITE_DATABASE_NAMESPACE'),
					auth: win.localStorage.getItem('token'),
				},
				body,
				failOnStatusCode: false,
			}),
		)
	const traveller = (fields) => ({
		firstName: 'Rules',
		lastName: 'Test',
		tripDescription: 'Checking the trip date rules.',
		cities: ['tokyo'],
		...fields,
	})

	beforeEach(() => {
		cy.resetEmulators()
		cy.visit(loginUrl)
		performLogin()
	})

	it('accepts a start and an end on or after it, including a day trip', () => {
		save(traveller({ tripStart: '2025-03-12', tripEnd: '2025-03-19' }))
			.its('status')
			.should('eq', 200)
		save(traveller({ tripStart: '2025-06-14', tripEnd: '2025-06-14' }))
			.its('status')
			.should('eq', 200)
	})

	it('refuses an end date before the start date', () => {
		save(traveller({ tripStart: '2025-03-19', tripEnd: '2025-03-12' }))
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	it('refuses a date in another format', () => {
		save(traveller({ tripStart: '12/03/2025', tripEnd: '2025-03-19' }))
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	it('refuses one date without the other', () => {
		save(traveller({ tripStart: '2025-03-12' }))
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	it('refuses a days-in-city length that is not 1 to 366', () => {
		save(traveller({ daysInCity: 0 }))
			.its('status')
			.should('be.oneOf', [401, 403])
		save(traveller({ daysInCity: '5' }))
			.its('status')
			.should('be.oneOf', [401, 403])
	})
})
