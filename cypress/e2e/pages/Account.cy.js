import {
	ACCOUNT_MENU_SELECTORS,
	ACCOUNT_PAGE_SELECTORS,
	CHANGE_PASSWORD_FORM_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { ERROR_MESSAGES } from '../../../src/constants/errors'
import {
	ACCOUNT_SETTINGS_CONFIG,
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
