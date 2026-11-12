import {
	CONTACT_TRAVELLER_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { API_DATABASE } from '../../../src/constants/api'
import { CONTACT_TRAVELLER_CONFIG } from '../../../src/constants/travellers'
import { TEST_USERS } from '../../../src/constants/config/users'
import { PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'
import { atPath } from '../../support/utils/waitForSuccess'

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
				expect(request.body).to.deep.equal({
					senderId: TEST_USERS.TRAVELLER.ID,
					message: MESSAGE,
					createdAt: API_DATABASE.SERVER_TIMESTAMP,
					read: false,
				})
				// A 200 from the emulator means the rules accepted it
				expect(response.statusCode).to.eq(200)
			},
		)

		cy.waitForSuccess(atPath(PATHS.TRAVELLERS))
		cy.contains(CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE).should(
			'be.visible',
		)
	})
})

// Talks to the emulator directly, as a script could, so a pass proves the rules and not just the UI
describe('Messages database rules', () => {
	const messagesUrl = (recipientId, path = '') =>
		`${Cypress.expose('VITE_DATABASE_URL')}/messages/${recipientId}${path}.json`
	const send = (token, body, recipientId = TEST_USERS.OTHER_TRAVELLER.ID) =>
		cy.request({
			method: API_DATABASE.POST,
			url: messagesUrl(recipientId),
			qs: { ns: Cypress.expose('VITE_DATABASE_NAMESPACE'), auth: token },
			body,
			failOnStatusCode: false,
		})
	const validBody = (senderId) => ({
		senderId,
		message: 'Hello from the rules test.',
		createdAt: API_DATABASE.SERVER_TIMESTAMP,
		read: false,
	})
	const signedInToken = () =>
		cy.window().then((win) => win.localStorage.getItem('token'))

	beforeEach(() => {
		cy.resetEmulators()
	})

	it('refuses a message from a signed-in user who is not a traveller', () => {
		performLogin()
		cy.window().then((win) => {
			send(
				win.localStorage.getItem('token'),
				validBody(win.localStorage.getItem('userId')),
			)
				.its('status')
				.should('be.oneOf', [401, 403])
		})
	})

	it('refuses a message with no sign-in', () => {
		send(undefined, validBody(TEST_USERS.TRAVELLER.ID))
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	describe('as a traveller', () => {
		beforeEach(() => {
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)
		})

		it('accepts a message written as themselves', () => {
			signedInToken().then((token) =>
				send(token, validBody(TEST_USERS.TRAVELLER.ID))
					.its('status')
					.should('eq', 200),
			)
		})

		it('refuses a message written as someone else', () => {
			signedInToken().then((token) =>
				send(token, validBody(TEST_USERS.OTHER_TRAVELLER.ID))
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})

		it('refuses a message to themselves', () => {
			signedInToken().then((token) =>
				send(
					token,
					validBody(TEST_USERS.TRAVELLER.ID),
					TEST_USERS.TRAVELLER.ID,
				)
					.its('status')
					.should('be.oneOf', [401, 403]),
			)
		})

		it('refuses a new message that is already read, carries an email or sets its own time', () => {
			signedInToken().then((token) => {
				const base = validBody(TEST_USERS.TRAVELLER.ID)
				;[
					{ ...base, read: true },
					{ ...base, userEmail: TEST_USERS.TRAVELLER.EMAIL },
					{ ...base, createdAt: 1 },
				].forEach((body) =>
					send(token, body)
						.its('status')
						.should('be.oneOf', [401, 403]),
				)
			})
		})

		it('refuses to mark a message read in someone else’s inbox', () => {
			signedInToken().then((token) =>
				send(token, validBody(TEST_USERS.TRAVELLER.ID)).then(
					({ body }) =>
						cy
							.request({
								method: API_DATABASE.PUT,
								url: messagesUrl(
									TEST_USERS.OTHER_TRAVELLER.ID,
									`/${body.name}/read`,
								),
								qs: {
									ns: Cypress.expose(
										'VITE_DATABASE_NAMESPACE',
									),
									auth: token,
								},
								body: true,
								failOnStatusCode: false,
							})
							.its('status')
							.should('be.oneOf', [401, 403]),
				),
			)
		})
	})
})
