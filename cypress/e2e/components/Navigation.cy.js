import {
	ACCOUNT_MENU_SELECTORS,
	FOOTER_SELECTORS,
	HEADER_SELECTORS,
	TAB_BAR_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { TEST_USERS } from '../../../src/constants/config/users'

import { performLogin } from '../../support/utils/authHelpers'

describe('Not logged in > Navigation', () => {
	beforeEach(() => {
		cy.visit(BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	})

	it('shows the brand only: no nav, account button or tab bar', () => {
		cy.setViewportToMobile()
		cy.assertHeaderTitleLink()

		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER).should('not.exist')
		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('not.exist')
		cy.get(TAB_BAR_SELECTORS.ROOT).should('not.exist')
	})

	it('links the brand to the log in page', () => {
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).click()
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.AUTHENTICATION)
	})
})

describe('Logged in, not a traveller > Navigation', () => {
	beforeEach(() => {
		// An earlier spec can leave a traveller record for this user, which swaps Register for My trip
		cy.resetEmulators()
		performLogin()
	})

	it('links the brand to Travellers', () => {
		cy.get(HEADER_SELECTORS.SITE_HEADER_TITLE_LINK).click()
		cy.url().should('eq', BASE_URL_CYPRESS + PATHS.TRAVELLERS)
	})

	it('offers Travellers and Register in the tab bar on a phone', () => {
		cy.setViewportToMobile()

		cy.get(TAB_BAR_SELECTORS.ROOT).should('be.visible')
		cy.get(TAB_BAR_SELECTORS.REGISTER).click()
		cy.url().should('include', PATHS.REGISTER)
		cy.get(TAB_BAR_SELECTORS.REGISTER).should(
			'have.attr',
			'aria-current',
			'page',
		)
	})

	it('logs out from the account menu on a phone', () => {
		cy.setViewportToMobile()

		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
		cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).click()

		cy.url().should('include', PATHS.AUTHENTICATION)
		cy.get(TAB_BAR_SELECTORS.ROOT).should('not.exist')
	})
})

describe('Logged in as a traveller > Navigation', () => {
	beforeEach(() => {
		cy.resetEmulators()
		performLogin(TEST_USERS.TRAVELLER.EMAIL, TEST_USERS.TRAVELLER.PASSWORD)
	})

	it('moves between Travellers, Messages and My trip from the desktop nav', () => {
		cy.setViewportToDesktop()

		cy.get(TAB_BAR_SELECTORS.ROOT).should('not.be.visible')
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES).click()
		cy.url().should('include', PATHS.MESSAGES)
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES).should(
			'have.attr',
			'aria-current',
			'page',
		)

		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MY_TRIP).click()
		cy.url().should(
			'eq',
			`${BASE_URL_CYPRESS}${PATHS.TRAVELLERS}/${TEST_USERS.TRAVELLER.ID}`,
		)
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MY_TRIP).should(
			'have.attr',
			'aria-current',
			'page',
		)
	})

	it('moves between places from the tab bar on a phone', () => {
		cy.setViewportToMobile()

		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER).should(
			'not.be.visible',
		)
		cy.get(TAB_BAR_SELECTORS.MESSAGES).click()
		cy.url().should('include', PATHS.MESSAGES)
		cy.get(TAB_BAR_SELECTORS.MY_TRIP).click()
		cy.url().should(
			'include',
			`${PATHS.TRAVELLERS}/${TEST_USERS.TRAVELLER.ID}`,
		)
		cy.get(TAB_BAR_SELECTORS.MY_TRIP).should(
			'have.attr',
			'aria-current',
			'page',
		)
	})

	it('keeps the footer reachable above the tab bar on a phone', () => {
		cy.setViewportToMobile()
		cy.visit(PATHS.PRIVACY)

		cy.scrollTo('bottom')
		cy.get(FOOTER_SELECTORS.PRIVACY_LINK).then(($privacy) => {
			cy.get(TAB_BAR_SELECTORS.ROOT).should(($bar) => {
				expect(
					$privacy[0].getBoundingClientRect().bottom,
				).to.be.at.most($bar[0].getBoundingClientRect().top)
			})
		})
		cy.get(FOOTER_SELECTORS.PRIVACY_LINK).click()
		cy.url().should('include', PATHS.PRIVACY)
	})

	it('logs out from the account menu on desktop', () => {
		cy.setViewportToDesktop()

		cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
		cy.get(ACCOUNT_MENU_SELECTORS.SIGNED_IN_AS).should('be.visible')
		cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).click()

		cy.url().should('include', PATHS.AUTHENTICATION)
		cy.visit(PATHS.MESSAGES)
		cy.url().should('include', PATHS.AUTHENTICATION)
	})
})
