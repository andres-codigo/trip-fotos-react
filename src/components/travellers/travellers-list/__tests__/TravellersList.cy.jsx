import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import {
	COMMON_SELECTORS,
	DIALOG_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
} from '@/constants/test'
import { GLOBAL, PATHS } from '@/constants/ui'

import TravellersList from '@/components/travellers/travellers-list/TravellersList'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const USER_ID = 'me'
const TRAVELLERS_URL = '**/travellers.json*'

const record = (firstName, cities) => ({
	firstName,
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines.',
	daysInCity: 7,
	cities,
	files: [],
	registered: '2024-03-05T10:00:00.000Z',
})

const onServer = {
	ada: record('Ada', ['tokyo']),
	grace: record('Grace', ['prague']),
}

const listed = Object.entries(onServer).map(([id, traveller]) => ({
	id,
	...traveller,
}))

const mountList = ({ travellers = {}, props = {} } = {}) => {
	const store = configureStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token: 'token',
				userId: USER_ID,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				...travellers,
			},
		},
	})

	cy.mount(
		<Provider store={store}>
			<MemoryRouter>
				<TravellersList {...props} />
			</MemoryRouter>
		</Provider>,
	)
}

// A list fetched moments ago is shown straight away and not reloaded on mount
const alreadyLoaded = (overrides = {}) => ({
	travellers: listed,
	hasTravellers: true,
	lastFetch: Date.now(),
	...overrides,
})

describe('<TravellersList />', () => {
	describe('Loading', () => {
		it('shows a spinner while the first load runs, then the travellers', () => {
			cy.intercept('GET', TRAVELLERS_URL, {
				body: onServer,
				delay: 300,
			}).as('load')
			mountList()

			cy.get(COMMON_SELECTORS.BASE_SPINNER).should('exist')
			cy.wait('@load')

			cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
		})

		it('says so when there are no travellers', () => {
			cy.intercept('GET', TRAVELLERS_URL, { body: null }).as('load')
			mountList()

			cy.wait('@load')

			cy.get(TRAVELLERS_LIST_SELECTORS.NO_TRAVELLERS).should(
				'contain.text',
				'No travellers listed.',
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'not.exist',
			)
		})

		it('shows an error dialog when loading fails and closes it', () => {
			cy.intercept('GET', TRAVELLERS_URL, {
				statusCode: 500,
				body: {},
			}).as('load')
			mountList()

			cy.wait('@load')

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('be.visible')
			cy.get(DIALOG_SELECTORS.TITLE).should(
				'have.text',
				GLOBAL.ERROR_DIALOG_TITLE,
			)

			cy.get(DIALOG_SELECTORS.CLOSE_BUTTON).click()

			cy.get(DIALOG_SELECTORS.TRAVELLERS_LIST_ERROR).should('not.exist')
		})

		it('does not reload a list that was fetched moments ago', () => {
			cy.intercept('GET', TRAVELLERS_URL, cy.spy().as('requested'))
			mountList({ travellers: alreadyLoaded() })

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
			cy.get('@requested').should('not.have.been.called')
		})

		it('reloads when Refresh is pressed', () => {
			cy.intercept('GET', TRAVELLERS_URL, { body: onServer }).as(
				'refresh',
			)
			mountList({ travellers: alreadyLoaded() })

			cy.get(TRAVELLERS_LIST_SELECTORS.REFRESH_BUTTON).click()

			cy.wait('@refresh')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
		})
	})

	describe('Register link', () => {
		it('is offered to a signed-in user who is not yet a traveller', () => {
			mountList({
				travellers: alreadyLoaded({
					isTraveller: false,
					isTravellerCheckedFor: USER_ID,
				}),
			})

			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK)
				.should('have.attr', 'href', PATHS.REGISTER)
				.and('contain.text', 'Register')
		})

		it('is not offered to someone who is already a traveller', () => {
			mountList({
				travellers: alreadyLoaded({
					isTraveller: true,
					isTravellerCheckedFor: USER_ID,
				}),
			})

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('not.exist')
		})

		it('is not offered until the traveller check has finished', () => {
			mountList({
				travellers: alreadyLoaded({
					isTraveller: false,
					isTravellerCheckedFor: null,
				}),
			})

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.REGISTER_LINK).should('not.exist')
		})
	})

	describe('City filter', () => {
		beforeEach(() => {
			mountList({ travellers: alreadyLoaded() })
		})

		it('offers one checkbox per city, all ticked', () => {
			cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX)
				.should('have.length', 2)
				.and('be.checked')
		})

		it('hides travellers from an unticked city', () => {
			cy.contains('label', 'Tokyo, Japan').click()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
				.should('have.length', 1)
				.and('contain.text', 'Grace Lovelace')
		})

		it('says so when no city is ticked', () => {
			cy.contains('label', 'Tokyo, Japan').click()
			cy.contains('label', 'Prague, Czechia').click()

			cy.get(TRAVELLERS_LIST_SELECTORS.NO_MATCHING_TRAVELLERS).should(
				'contain.text',
				'No travellers match the selected cities.',
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLERS_LIST).should(
				'not.exist',
			)
		})
	})

	describe('Accessibility', () => {
		it('has no axe violations', () => {
			mountList({ travellers: alreadyLoaded() })

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should('exist')
			cy.checkA11y()
		})
	})
})
