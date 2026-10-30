import {
	CONTACT_TRAVELLER_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { API_DATABASE } from '../../../src/constants/api'
import { CONTACT_TRAVELLER_CONFIG } from '../../../src/constants/travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000
const OTHER_TRAVELLER_ID = 'e2e-other-traveller'

const contactPath = (id) => `${PATHS.TRAVELLERS}/${id}/contact`

// Seeds the persisted traveller state a returning user would carry; checkedFor null is a new device
const visitAsTraveller = (path, { isNewDevice = false } = {}) => {
	cy.stubTravellerCheck(true)
	cy.visit(path, {
		onBeforeLoad(win) {
			const persisted = JSON.parse(
				win.localStorage.getItem('persist:root'),
			)
			const travellers = JSON.parse(persisted.travellers)
			persisted.travellers = JSON.stringify({
				...travellers,
				isTraveller: !isNewDevice,
				isTravellerCheckedFor: isNewDevice
					? null
					: win.localStorage.getItem('userId'),
			})
			win.localStorage.setItem('persist:root', JSON.stringify(persisted))
		},
	})
}

const assertRedirectedToDetail = (id) => {
	cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
		'eq',
		`${PATHS.TRAVELLERS}/${id}`,
	)
	cy.get(TRAVELLER_DETAIL_SELECTORS.ROOT).should('exist')
	cy.get(CONTACT_TRAVELLER_SELECTORS.ROOT).should('not.exist')
}

describe('Contact Traveller Page', () => {
	beforeEach(() => {
		performLogin()
	})

	it('shows the contact form to a traveller after a hard reload', () => {
		visitAsTraveller(contactPath(OTHER_TRAVELLER_ID))

		cy.location('pathname').should('eq', contactPath(OTHER_TRAVELLER_ID))
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
	})

	it('shows the contact form to a traveller on a new device once the check resolves', () => {
		visitAsTraveller(contactPath(OTHER_TRAVELLER_ID), { isNewDevice: true })

		cy.wait('@travellerCheck', { timeout: REQUEST_TIMEOUT })
		cy.location('pathname').should('eq', contactPath(OTHER_TRAVELLER_ID))
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
	})

	it('redirects a traveller away from contacting their own record', () => {
		cy.window()
			.then((win) => win.localStorage.getItem('userId'))
			.then((userId) => {
				visitAsTraveller(contactPath(userId))
				assertRedirectedToDetail(userId)
			})
	})

	it('redirects a non-traveller to the traveller detail page', () => {
		cy.visit(contactPath(OTHER_TRAVELLER_ID))
		assertRedirectedToDetail(OTHER_TRAVELLER_ID)
	})

	it('has no axe violations on the contact form', () => {
		visitAsTraveller(contactPath(OTHER_TRAVELLER_ID))
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')

		cy.checkA11y()
	})

	it('has no axe violations on the traveller detail page', () => {
		cy.visit(contactPath(OTHER_TRAVELLER_ID))
		assertRedirectedToDetail(OTHER_TRAVELLER_ID)

		cy.checkA11y()
	})
})

describe('Contact Traveller page > sending a message', () => {
	const MESSAGE = 'Which month did you travel in?'
	const MESSAGE_URL = '**/messages/*.json*'
	const recipientPath = contactPath(TEST_USERS.OTHER_TRAVELLER.ID)

	beforeEach(() => {
		cy.resetEmulators()
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
		cy.visit(recipientPath)
		cy.get(CONTACT_TRAVELLER_SELECTORS.FORM).should('be.visible')
	})

	it('sends the message and returns to the travellers list with a confirmation', () => {
		cy.intercept(API_DATABASE.POST, MESSAGE_URL).as('sendMessage')

		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type(MESSAGE)
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()

		cy.wait('@sendMessage', { timeout: REQUEST_TIMEOUT }).then(
			({ request, response }) => {
				expect(request.url).to.include(
					`/messages/${TEST_USERS.OTHER_TRAVELLER.ID}.json`,
				)
				expect(request.body).to.include({
					userEmail: TEST_USERS.TRAVELLER.EMAIL,
					message: MESSAGE,
				})
				expect(response.statusCode).to.eq(200)
			},
		)

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			PATHS.TRAVELLERS,
		)
		cy.contains(CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE).should(
			'be.visible',
		)
	})

	it('shows an error dialog and keeps the typed message when sending fails', () => {
		cy.intercept(API_DATABASE.POST, MESSAGE_URL, {
			statusCode: 500,
			body: {},
		}).as('sendMessage')

		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type(MESSAGE)
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
		cy.wait('@sendMessage', { timeout: REQUEST_TIMEOUT })

		cy.get(CONTACT_TRAVELLER_SELECTORS.ERROR_DIALOG).should('be.visible')
		cy.location('pathname').should('eq', recipientPath)
		cy.get(CONTACT_TRAVELLER_SELECTORS.SENDING_DIALOG).should('not.exist')
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).should(
			'have.value',
			MESSAGE,
		)
	})
})
