import { API_DATABASE } from '../../../src/constants/api'
import {
	AUTHENTICATION_FORM_SELECTORS,
	PUBLIC_TRAVELLER_ITEM_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
	TRAVELLERS_WELCOME_SELECTORS,
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

describe('Travellers page > logged out', () => {
	const { SAMPLE_TRAVELLER_ONE: FIRST, SAMPLE_TRAVELLER_TWO: SECOND } =
		MOCK_TRAVELLERS

	beforeEach(() => {
		cy.resetEmulators()
		cy.clearAllLocalStorage()
		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS)
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.ROOT, {
			timeout: REQUEST_TIMEOUT,
		}).should('have.length', 2)
	})

	it('has no axe violations', () => {
		cy.checkA11y()
	})

	it('shows each trip as a preview, newest first, with no description or full name', () => {
		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).should('be.visible')
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.NAME)
			.first()
			.should('have.text', `${FIRST.firstName} ${FIRST.lastName[0]}.`)
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.NAME)
			.last()
			.should('have.text', `${SECOND.firstName} ${SECOND.lastName[0]}.`)
		// The seeded first traveller has four photos; only the cover is public
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.ROOT)
			.first()
			.find('img')
			.should('have.length', 1)
		cy.contains(FIRST.tripDescription).should('not.exist')
		cy.contains(FIRST.lastName).should('not.exist')
		cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('not.exist')
	})

	it('narrows the preview by city', () => {
		cy.contains(TRAVELLER_FILTER_SELECTORS.OPTION, 'Prague').click()
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.ROOT).should('have.length', 1)
		cy.contains(FIRST.firstName).should('exist')
	})

	it('sends View trip to Log in, which names the trip and returns to it', () => {
		cy.get(PUBLIC_TRAVELLER_ITEM_SELECTORS.VIEW_TRIP).first().click()

		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
		cy.get('[data-cy="user-authentication-form-notice"]').should(
			'have.text',
			`Log in or create an account to see ${FIRST.firstName}'s trip.`,
		)

		cy.get(AUTHENTICATION_FORM_SELECTORS.EMAIL_INPUT).type(
			TEST_USERS.TRAVELLER.EMAIL,
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.PASSWORD_INPUT).type(
			TEST_USERS.TRAVELLER.PASSWORD,
			{ log: false },
		)
		cy.get(AUTHENTICATION_FORM_SELECTORS.LOGIN_SIGNUP_SUBMIT_BUTTON).click()

		cy.location('pathname', { timeout: REQUEST_TIMEOUT }).should(
			'eq',
			`${PATHS.TRAVELLERS}/${TEST_USERS.TRAVELLER.ID}`,
		)
		cy.contains(FIRST.tripDescription).should('be.visible')
	})

	it('opens the sign-up form from Create an account', () => {
		cy.get(TRAVELLERS_WELCOME_SELECTORS.CREATE_ACCOUNT).click()
		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
		cy.get('h1').should('have.text', 'Create an account')
	})

	it('offers Log in in the header', () => {
		cy.get('[data-cy="site-header-log-in"]').click()
		cy.location('pathname').should('eq', PATHS.AUTHENTICATION)
		cy.get('[data-cy="site-header-log-in"]').should('not.exist')
	})
})

// Talks to the emulator directly, as a script could, so a pass proves the rules and not just the page
describe('Public trips database rules', () => {
	const PUBLIC_FIELDS = [
		'firstName',
		'lastInitial',
		'cities',
		'tripStart',
		'tripEnd',
		'daysInCity',
		'cover',
	]
	const database = (path, { auth, ...options } = {}) =>
		cy.request({
			url: `${Cypress.expose('VITE_DATABASE_URL')}/${path}.json`,
			qs: {
				ns: Cypress.expose('VITE_DATABASE_NAMESPACE'),
				...(auth && { auth }),
			},
			failOnStatusCode: false,
			...options,
		})
	const signedIn = (path, options) =>
		cy.window().then((win) =>
			database(path, {
				auth: win.localStorage.getItem('token'),
				...options,
			}),
		)
	const summary = (fields) => ({
		firstName: 'Rules',
		lastInitial: 'T',
		cities: ['tokyo'],
		...fields,
	})

	beforeEach(() => {
		cy.resetEmulators()
	})

	it('keeps full traveller records from logged-out visitors', () => {
		database('travellers').its('status').should('be.oneOf', [401, 403])
		database(`travellers/${TEST_USERS.TRAVELLER.ID}`)
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	it('lets anyone read the public summaries, which hold only the public fields', () => {
		database('publicTrips').then(({ status, body }) => {
			expect(status).to.eq(200)
			expect(body).to.have.property(TEST_USERS.TRAVELLER.ID)
			Object.values(body).forEach((trip) => {
				expect(PUBLIC_FIELDS).to.include.members(Object.keys(trip))
				if (trip.cover) {
					expect(Object.keys(trip.cover)).to.include.members(['url'])
				}
			})
		})
	})

	it('lets a signed-in user read the full records', () => {
		cy.visit(loginUrl)
		performLogin()
		signedIn('travellers').its('status').should('eq', 200)
	})

	it('accepts a summary with only the public fields from its own traveller', () => {
		cy.visit(loginUrl)
		performLogin()
		cy.window().then((win) =>
			signedIn(`publicTrips/${win.localStorage.getItem('userId')}`, {
				method: API_DATABASE.PUT,
				body: summary({
					tripStart: '2025-03-12',
					tripEnd: '2025-03-19',
					cover: {
						url: 'https://example.com/photo.jpg',
						alt: 'Tokyo',
					},
				}),
			})
				.its('status')
				.should('eq', 200),
		)
	})

	it('refuses a summary carrying a private field', () => {
		cy.visit(loginUrl)
		performLogin()
		cy.window().then((win) => {
			const path = `publicTrips/${win.localStorage.getItem('userId')}`
			signedIn(path, {
				method: API_DATABASE.PUT,
				body: summary({ tripDescription: 'Private words.' }),
			})
				.its('status')
				.should('be.oneOf', [401, 403])
			signedIn(path, {
				method: API_DATABASE.PUT,
				body: summary({ lastName: 'Test' }),
			})
				.its('status')
				.should('be.oneOf', [401, 403])
			signedIn(path, {
				method: API_DATABASE.PUT,
				body: summary({
					cover: { url: 'https://example.com/a.jpg', extra: 'x' },
				}),
			})
				.its('status')
				.should('be.oneOf', [401, 403])
		})
	})

	it("refuses a summary written for someone else's trip", () => {
		cy.visit(loginUrl)
		performLogin()
		signedIn(`publicTrips/${TEST_USERS.TRAVELLER.ID}`, {
			method: API_DATABASE.PUT,
			body: summary(),
		})
			.its('status')
			.should('be.oneOf', [401, 403])
	})

	it('refuses any write from a logged-out visitor', () => {
		database(`publicTrips/${TEST_USERS.TRAVELLER.ID}`, {
			method: API_DATABASE.PUT,
			body: summary(),
		})
			.its('status')
			.should('be.oneOf', [401, 403])
	})
})
