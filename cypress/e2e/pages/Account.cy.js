import {
	ACCOUNT_MENU_SELECTORS,
	ACCOUNT_PAGE_SELECTORS,
	AUTH_ACTION_PAGE_SELECTORS,
	CHANGE_EMAIL_FORM_SELECTORS,
	CHANGE_PASSWORD_FORM_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { ERROR_MESSAGES } from '../../../src/constants/errors'
import { API_DATABASE } from '../../../src/constants/api'
import {
	ACCOUNT_SETTINGS_CONFIG,
	AUTH_ACTION_CONFIG,
	AUTH_ACTION_MODES,
	VERIFIED_CHIP_CONFIG,
} from '../../../src/constants/auth'
import { TEST_USERS } from '../../../src/constants/config/users'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

import { performLogin } from '../../support/utils/authHelpers'

describe('Not logged in > Account settings page', () => {
	it('sends a signed-out visitor to log in and back', () => {
		cy.visit(PATHS.ACCOUNT)

		cy.url().should(
			'eq',
			`${BASE_URL_CYPRESS}${PATHS.AUTHENTICATION}?redirect=${encodeURIComponent(PATHS.ACCOUNT)}`,
		)
	})
})

describe('Logged in > Account settings page', () => {
	beforeEach(() => {
		cy.resetEmulators()
		cy.stubTravellerCheck()
		performLogin()
	})

	it('opens from the account menu and shows the verified email', () => {
		cy.visit(PATHS.TRAVELLERS)
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
		cy.get(ACCOUNT_MENU_SELECTORS.EMAIL).should(
			'have.text',
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(ACCOUNT_MENU_SELECTORS.ACCOUNT_SETTINGS).click()

		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.ACCOUNT)
		cy.get(ACCOUNT_PAGE_SELECTORS.TITLE).should(
			'have.text',
			ACCOUNT_SETTINGS_CONFIG.TITLE,
		)
		cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL).should(
			'have.text',
			TEST_USERS.STANDARD.EMAIL,
		)
		cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SECTION).should(
			'contain.text',
			VERIFIED_CHIP_CONFIG.VERIFIED,
		)
	})

	it('has no axe violations, with the form open too', () => {
		cy.visit(PATHS.ACCOUNT)
		cy.get(PAGE_SELECTORS.ACCOUNT_MAIN_CONTAINER).should('be.visible')
		cy.checkA11y()

		cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_PASSWORD).click()
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('refuses a wrong current password and keeps the form open', () => {
		cy.visit(PATHS.ACCOUNT)
		cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_PASSWORD).click()
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_INPUT)
			.should('have.focus')
			.type('not-the-password')
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.NEW_PASSWORD_INPUT).type(
			'another-password',
		)
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.SAVE_PASSWORD).click()

		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_ERROR).should(
			'contain.text',
			ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
		)
		cy.get(CHANGE_PASSWORD_FORM_SELECTORS.CURRENT_PASSWORD_INPUT).should(
			'have.focus',
		)
	})
})

describe('Logged in > Account settings > Change email', () => {
	const REQUEST_TIMEOUT = 10000
	const PASSWORD = 'change-email-password'

	// The auth emulator keeps every email link it would have sent
	const visitEmailLink = (requestType, mode) =>
		cy
			.request(
				`${new URL(API_DATABASE.URL).origin}/emulator/v1/projects/${Cypress.expose('FIREBASE_PROJECT_ID')}/oobCodes`,
			)
			.then(({ body }) => {
				const { oobCode } = body.oobCodes.findLast(
					(code) => code.requestType === requestType,
				)
				cy.visit(`${PATHS.AUTH_ACTION}?mode=${mode}&oobCode=${oobCode}`)
			})

	// A throwaway account, so the change leaves every seeded login as it was
	it('sends a link to the new address, changes the email when it is opened and lets the old address undo it', () => {
		const email = `change-email-${Date.now()}@example.com`
		const newEmail = `changed-${Date.now()}@example.org`
		cy.resetEmulators()
		cy.stubTravellerCheck()
		cy.request(
			'POST',
			`${Cypress.expose('API_URL')}signUp?key=${Cypress.expose('API_KEY')}`,
			{ email, password: PASSWORD, returnSecureToken: true },
		)
		performLogin(email, PASSWORD)

		cy.visit(PATHS.ACCOUNT)
		cy.get(ACCOUNT_PAGE_SELECTORS.CHANGE_EMAIL).click()
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.NEW_EMAIL_INPUT)
			.should('have.focus')
			.type(newEmail)
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.CURRENT_PASSWORD_INPUT).type(
			PASSWORD,
			{
				log: false,
			},
		)
		cy.checkA11y()
		cy.get(CHANGE_EMAIL_FORM_SELECTORS.SEND_LINK).click()

		cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL_SENT, { timeout: REQUEST_TIMEOUT })
			.should('contain.text', newEmail)
			.and('contain.text', email)
			.and('have.focus')
		cy.get(ACCOUNT_PAGE_SELECTORS.EMAIL).should('have.text', email)
		cy.checkA11y()

		visitEmailLink(
			'VERIFY_AND_CHANGE_EMAIL',
			AUTH_ACTION_MODES.VERIFY_AND_CHANGE_EMAIL,
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE, { timeout: REQUEST_TIMEOUT })
			.should('have.text', AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE)
			.and('have.focus')
		cy.get(AUTH_ACTION_PAGE_SELECTORS.EMAIL).should('have.text', newEmail)
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('not.exist')
		cy.location('pathname').should('eq', PATHS.AUTH_ACTION)

		// The Auth emulator changes the email but never sends the old address its recover link, so that link's two answers are stubbed
		cy.intercept('POST', '**/accounts:resetPassword*', {
			email,
			newEmail,
			requestType: 'RECOVER_EMAIL',
		})
		cy.intercept('POST', '**/accounts:update*', { email })
		cy.visit(
			`${PATHS.AUTH_ACTION}?mode=${AUTH_ACTION_MODES.RECOVER_EMAIL}&oobCode=recover-code`,
		)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.TITLE, {
			timeout: REQUEST_TIMEOUT,
		}).should('have.text', AUTH_ACTION_CONFIG.EMAIL_RECOVERED_TITLE)
		cy.get(AUTH_ACTION_PAGE_SELECTORS.EMAIL).should('have.text', email)
		cy.checkA11y()
	})
})
