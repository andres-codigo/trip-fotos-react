import {
	COMMON_SELECTORS,
	EDIT_TRIP_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
	TRIP_PHOTOS_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { API_DATABASE } from '../../../src/constants/api'
import {
	EDIT_TRIP_CONFIG,
	TRAVELLER_ITEM_CONFIG,
} from '../../../src/constants/travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const SEEDED_PHOTO_COUNT = 4
const TRAVELLER_ID = TEST_USERS.TRAVELLER.ID
const detailPath = `${PATHS.TRAVELLERS}/${TRAVELLER_ID}`
const editPath = `${detailPath}${TRAVELLER_ITEM_CONFIG.EDIT_PATH_SEGMENT}`

const openEditPage = () => {
	performLogin(
		TEST_USERS.TRAVELLER.EMAIL,
		TEST_USERS.TRAVELLER.PASSWORD,
		editPath,
	)
	cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM, {
		timeout: REQUEST_TIMEOUT,
	}).should('be.visible')
}

const save = () =>
	cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON).click()

describe('Edit Trip page', () => {
	let uploadedImageUrls = []

	// The seed restores the record, so each test starts from the seeded traveller
	beforeEach(() => {
		cy.resetEmulators()
		cy.intercept(API_DATABASE.PATCH, '**/travellers/*.json*').as('saveTrip')
	})

	// afterEach rather than the test body, so uploads are removed even when a later assertion fails
	afterEach(() => {
		uploadedImageUrls.forEach((url) => cy.deleteStorageObject(url))
		uploadedImageUrls = []
	})

	it('has no axe violations', () => {
		openEditPage()
		cy.get(TRIP_PHOTOS_SELECTORS.TILE).should(
			'have.length',
			SEEDED_PHOTO_COUNT,
		)

		cy.checkA11y()
	})

	it('saves an edited field and shows it on the trip with the alert', () => {
		const description = 'Rewritten after the trip.'
		openEditPage()

		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT)
			.clear()
			.type(description)
		save()

		cy.wait('@saveTrip', { timeout: REQUEST_TIMEOUT })
		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			detailPath,
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.SAVED_ALERT).should(
			'contain.text',
			EDIT_TRIP_CONFIG.SAVED_MESSAGE,
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.TRIP_DESCRIPTION).should(
			'have.text',
			description,
		)
		cy.assertTravellerPersisted(TRAVELLER_ID, {
			tripDescription: description,
		})
	})

	it('adds a photo', () => {
		cy.intercept('POST', '**/v0/b/*/o*').as('uploadImage')
		openEditPage()

		cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
			'cypress/fixtures/test-image.png',
			{ force: true },
		)
		cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should('have.length', 1)
		save()

		cy.wait('@uploadImage', { timeout: REQUEST_TIMEOUT })
		cy.wait('@saveTrip', { timeout: REQUEST_TIMEOUT })
			.its('request.body')
			.then(({ files, fileThumbnails }) => {
				expect(files).to.have.length(SEEDED_PHOTO_COUNT + 1)
				uploadedImageUrls.push(
					files.at(-1),
					...fileThumbnails.at(-1).map(({ url }) => url),
				)
			})

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			detailPath,
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST)
			.find(COMMON_SELECTORS.BASE_IMAGE_BUTTON)
			.should('have.length', SEEDED_PHOTO_COUNT + 1)
	})

	it('removes a photo after undoing a first removal', () => {
		openEditPage()

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).first().click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).should('have.length', 1)
		cy.get(TRIP_PHOTOS_SELECTORS.UNDO).click()
		cy.get(TRIP_PHOTOS_SELECTORS.REMOVED).should('not.exist')

		cy.get(TRIP_PHOTOS_SELECTORS.REMOVE).first().click()
		save()

		cy.wait('@saveTrip', { timeout: REQUEST_TIMEOUT })
			.its('request.body.files')
			.should('have.length', SEEDED_PHOTO_COUNT - 1)
		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			detailPath,
		)
		cy.get(TRAVELLER_DETAIL_SELECTORS.IMAGES_LIST)
			.find(COMMON_SELECTORS.BASE_IMAGE_BUTTON)
			.should('have.length', SEEDED_PHOTO_COUNT - 1)
	})

	it('deletes the profile and offers Register again', () => {
		openEditPage()

		cy.get(EDIT_TRIP_SELECTORS.DELETE).click()
		cy.get(EDIT_TRIP_SELECTORS.DELETE_DIALOG).should('be.visible')
		cy.get(EDIT_TRIP_SELECTORS.DELETE_CONFIRM).click()

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			PATHS.TRAVELLERS,
		)
		cy.contains(EDIT_TRIP_CONFIG.DELETED_MESSAGE).should('be.visible')
		cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('be.visible')
	})
})
