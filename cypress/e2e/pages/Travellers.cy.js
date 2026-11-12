import { API_DATABASE } from '../../../src/constants/api'
import {
	TRAVELLERS_LIST_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLER_ITEM_SELECTORS,
} from '../../../src/constants/test/selectors/components'
import { ERROR_MESSAGES } from '../../../src/constants/errors'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'

import { MOCK_TRAVELLERS } from '../../../src/constants/test/mock-data/mock-travellers'
import { TEST_USERS } from '../../../src/constants/config/users'

import { performLogin } from '../../support/utils/authHelpers'

const loginUrl = BASE_URL_CYPRESS + PATHS.AUTHENTICATION
const REQUEST_TIMEOUT = 10000
describe('Travellers page', () => {
	beforeEach(() => {
		cy.visit(loginUrl)
	})

	describe('Basic Rendering', () => {
		it('has no axe violations', () => {
			performLogin()
			cy.get(PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER).should('exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.LOADING, {
				timeout: REQUEST_TIMEOUT,
			}).should('not.exist')

			cy.checkA11y()
		})
	})

	describe('Authentication & User States', () => {
		it('should show register link when user is logged in and not a traveller', () => {
			performLogin()

			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('be.visible')
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should(
				'contain',
				'Register',
			)
		})

		it('should not show register link when user is logged in and is a traveller', () => {
			performLogin(
				TEST_USERS.TRAVELLER.EMAIL,
				TEST_USERS.TRAVELLER.PASSWORD,
			)

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'be.visible',
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('not.exist')
		})

		it('should navigate to register page when register link is clicked', () => {
			performLogin()

			// Wait for initial loading to complete so button is enabled
			cy.get(TRAVELLERS_LIST_SELECTORS.LOADING, {
				timeout: REQUEST_TIMEOUT,
			}).should('not.exist')

			// Ensure the link is enabled (not aria-disabled) before clicking
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK)
				.should('not.have.attr', 'aria-disabled', 'true')
				.click()

			// Wait for redirect
			cy.url({ timeout: REQUEST_TIMEOUT }).should(
				'include',
				PATHS.REGISTER,
			)
		})
	})

	describe('Data Loading & API Integration', () => {
		it('should load travellers on initial page visit', () => {
			// The emulator answers too fast for the loading state to be seen without a delay
			cy.intercept(API_DATABASE.GET, '**/travellers.json*', (req) => {
				req.on('response', (res) => {
					res.setDelay(1000)
				})
			})
			performLogin()

			// Should show loading state initially
			cy.get(TRAVELLERS_LIST_SELECTORS.LOADING).should('be.visible')

			// Wait for loading to complete
			cy.get(TRAVELLERS_LIST_SELECTORS.LOADING, {
				timeout: REQUEST_TIMEOUT,
			}).should('not.exist')

			// The seed holds two travellers
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST)
				.find(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
				.should('have.length', 2)
		})
	})

	describe('Error Handling', () => {
		it('should show an inline error when the network fails', () => {
			cy.intercept(API_DATABASE.GET, '**/travellers.json*', {
				forceNetworkError: true,
			}).as('getTravellersNetworkError')

			performLogin()
			cy.visit(PATHS.TRAVELLERS)
			cy.wait('@getTravellersNetworkError', { timeout: REQUEST_TIMEOUT })

			cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should('be.visible')
			cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should(
				'contain',
				ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
			)
		})
	})
})

describe('Travellers page > city filter', () => {
	const { SAMPLE_TRAVELLER_ONE: FIRST, SAMPLE_TRAVELLER_TWO: SECOND } =
		MOCK_TRAVELLERS

	beforeEach(() => {
		cy.resetEmulators()
		performLogin()
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			2,
		)
	})

	// The seed gives the first traveller eight cities, Prague and Tokyo among them, and the second only Tokyo
	// The checkbox is visually hidden inside the chip, so tick it the way a person does, by the chip
	const tick = (city) =>
		cy.contains(TRAVELLER_FILTER_SELECTORS.OPTION, city).click()

	it('starts with nothing ticked, narrows to a ticked city and widens again on Show all cities', () => {
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should('not.be.checked')
		cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).should(
			'have.attr',
			'aria-disabled',
			'true',
		)

		tick('Prague')
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			1,
		)
		cy.contains(FIRST.firstName).should('exist')
		cy.contains(SECOND.firstName).should('not.exist')

		cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).click()
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			2,
		)
		cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX).should('not.be.checked')
	})
})

describe('Travellers page > admin and standard users', () => {
	const { SAMPLE_TRAVELLER_TWO: SECOND } = MOCK_TRAVELLERS

	beforeEach(() => {
		cy.resetEmulators()
	})

	it('does not offer delete to a standard user', () => {
		performLogin()
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			2,
		)

		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).should('not.exist')
	})

	it('lets an admin delete a traveller after confirming', () => {
		performLogin(TEST_USERS.ADMIN.EMAIL, TEST_USERS.ADMIN.PASSWORD)
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			2,
		)
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE).should('have.length', 2)

		cy.contains(TRAVELLER_ITEM_SELECTORS.ROOT, SECOND.firstName)
			.find(TRAVELLER_ITEM_SELECTORS.DELETE)
			.click()
		cy.get(TRAVELLER_ITEM_SELECTORS.DELETE_CONFIRM).click()

		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			1,
		)
		cy.contains(SECOND.firstName).should('not.exist')

		cy.reload()
		cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
			'have.length',
			1,
		)
	})
})
