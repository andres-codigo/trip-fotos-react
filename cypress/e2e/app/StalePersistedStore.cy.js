import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { PAGE_SELECTORS } from '../../../src/constants/test/selectors/pages'
import {
	DIALOG_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	TRAVELLER_DETAIL_SELECTORS,
} from '../../../src/constants/test/selectors/components'

import { performLogin } from '../../support/utils/authHelpers'

const REQUEST_TIMEOUT = 10000

const STALE_ID = 'stale-traveller-that-is-not-in-the-database'
const STALE_NAME = 'Stale Traveller'

const STALE_TRAVELLER = {
	id: STALE_ID,
	firstName: 'Stale',
	lastName: 'Traveller',
	tripDescription: 'Left behind in localStorage',
	daysInCity: '3',
	cities: ['Nowhere'],
	registered: '2020-01-01T00:00:00.000Z',
}

// Persisted state from a signed-in browser whose traveller was later deleted from the database
const seedStalePersistedStore = (win) => {
	win.localStorage.setItem(
		'persist:root',
		JSON.stringify({
			authentication: JSON.stringify({
				token: win.localStorage.getItem('token'),
				userId: win.localStorage.getItem('userId'),
				userName: win.localStorage.getItem('userName'),
				userEmail: win.localStorage.getItem('userEmail'),
				didAutoLogout: false,
				status: 'succeeded',
				error: null,
				isAdmin: win.localStorage.getItem('isAdmin') === 'true',
			}),
			travellers: JSON.stringify({
				travellerName: STALE_NAME,
				isTraveller: true,
				hasTravellers: true,
				travellers: [STALE_TRAVELLER],
				selectedTraveller: STALE_TRAVELLER,
				lastFetch: Date.now(),
				status: 'succeeded',
				error: null,
				isTravellerCheckedFor: null,
			}),
			_persist: JSON.stringify({ version: -1, rehydrated: true }),
		}),
	)
}

describe('Stale persisted store', () => {
	beforeEach(() => {
		performLogin()
	})

	it('does not show a traveller that is no longer in the database', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS, {
			onBeforeLoad: seedStalePersistedStore,
		})

		cy.url().should('include', PATHS.TRAVELLERS)
		// The cached list must never be shown as current, so it is checked while loading as well as afterwards
		cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER).should('be.visible')
		cy.contains(STALE_NAME).should('not.exist')

		cy.get(DIALOG_SELECTORS.SPINNER_CONTAINER, {
			timeout: REQUEST_TIMEOUT,
		}).should('not.exist')
		cy.get(PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER).should('exist')
		cy.contains(STALE_NAME).should('not.exist')
	})

	it('does not show a stale traveller name on the Logout button', () => {
		cy.visit(BASE_URL_CYPRESS + PATHS.TRAVELLERS, {
			onBeforeLoad: seedStalePersistedStore,
		})

		cy.get(PAGE_SELECTORS.TRAVELLERS_MAIN_CONTAINER, {
			timeout: REQUEST_TIMEOUT,
		}).should('exist')
		cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_LOGOUT, {
			timeout: REQUEST_TIMEOUT,
		})
			.should('exist')
			.and('not.contain', STALE_NAME)
	})

	it('shows not found, and clears the stored copy, for a deleted traveller', () => {
		cy.visit(`${BASE_URL_CYPRESS}${PATHS.TRAVELLERS}/${STALE_ID}`, {
			onBeforeLoad: seedStalePersistedStore,
		})

		cy.get(TRAVELLER_DETAIL_SELECTORS.NOT_FOUND, {
			timeout: REQUEST_TIMEOUT,
		}).should('be.visible')
		cy.contains(STALE_NAME).should('not.exist')

		cy.window().should((win) => {
			const persisted = JSON.parse(
				win.localStorage.getItem('persist:root'),
			)
			expect(JSON.parse(persisted.travellers).selectedTraveller).to.equal(
				null,
			)
		})
	})
})
