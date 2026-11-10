import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'

import {
	COMMON_SELECTORS,
	TRAVELLER_FILTER_SELECTORS,
	TRAVELLER_SKELETON_SELECTORS,
	TRAVELLERS_LIST_SELECTORS,
} from '@/constants/test'
import { PATHS } from '@/constants/ui'
import { TRAVELLERS_LIST_CONFIG } from '@/constants/travellers'

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
		it('shows a page of skeleton cards while the first load runs, then the travellers', () => {
			cy.intercept('GET', TRAVELLERS_URL, {
				body: onServer,
				delay: 300,
			}).as('load')
			mountList()

			cy.get(TRAVELLERS_LIST_SELECTORS.LOADING).should(
				'have.text',
				TRAVELLERS_LIST_CONFIG.LOADING_LABEL,
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST)
				.should('have.attr', 'aria-busy', 'true')
				.find(TRAVELLER_SKELETON_SELECTORS.ROOT)
				.should('have.length', TRAVELLERS_LIST_CONFIG.PAGE_SIZE)
			cy.get(COMMON_SELECTORS.BASE_SPINNER).should('not.exist')
			cy.wait('@load')

			cy.get(TRAVELLERS_LIST_SELECTORS.SKELETON_LIST).should('not.exist')
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

		it('shows an inline error when loading fails, and Try again reloads', () => {
			cy.intercept('GET', TRAVELLERS_URL, {
				statusCode: 500,
				body: {},
			}).as('load')
			mountList()

			cy.wait('@load')

			cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR)
				.should('be.visible')
				.and('have.attr', 'role', 'alert')
				.and('contain.text', TRAVELLERS_LIST_CONFIG.LOAD_ERROR_TITLE)
			cy.get(TRAVELLERS_LIST_SELECTORS.NO_TRAVELLERS).should('not.exist')

			cy.intercept('GET', TRAVELLERS_URL, { body: onServer }).as('retry')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRY_AGAIN).click()
			cy.wait('@retry')

			cy.get(TRAVELLERS_LIST_SELECTORS.LOAD_ERROR).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
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
			cy.viewport(1280, 800)
			mountList({ travellers: alreadyLoaded() })
		})

		it('offers one unticked checkbox per city and shows everyone', () => {
			cy.get(TRAVELLER_FILTER_SELECTORS.CHECKBOX)
				.should('have.length', 2)
				.and('not.be.checked')
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
		})

		it('narrows to travellers from a ticked city, and Show all cities widens again', () => {
			cy.contains('label', 'Prague, Czechia').click()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
				.should('have.length', 1)
				.and('contain.text', 'Grace Lovelace')

			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_ALL).click()
			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
		})

		it('filters from the sheet on mobile', () => {
			cy.viewport(390, 844)

			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHEET)
				.contains('label', 'Tokyo, Japan')
				.click()
			cy.get(TRAVELLER_FILTER_SELECTORS.SHOW_MATCHES)
				.should('have.text', 'Show 1 traveller')
				.click()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
				.should('have.length', 1)
				.and('contain.text', 'Ada Lovelace')
			cy.get(TRAVELLER_FILTER_SELECTORS.TRIGGER).should(
				'contain.text',
				'1 of 2 cities',
			)
		})
	})

	describe('Paging', () => {
		const PAGE_SIZE = TRAVELLERS_LIST_CONFIG.PAGE_SIZE
		const many = Array.from({ length: 30 }, (_, index) => ({
			...listed[0],
			id: `traveller-${index}`,
			firstName: `Traveller ${index + 1}`,
		}))

		it('adds 12 at a time, focuses the first new card and ends with all shown', () => {
			mountList({ travellers: alreadyLoaded({ travellers: many }) })

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				PAGE_SIZE,
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.PAGE_STATUS)
				.should('have.attr', 'aria-live', 'polite')
				.and(
					'have.text',
					TRAVELLERS_LIST_CONFIG.PAGE_STATUS(PAGE_SIZE, 30, false),
				)

			cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE)
				.should(
					'have.text',
					TRAVELLERS_LIST_CONFIG.SHOW_MORE(PAGE_SIZE),
				)
				.click()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM)
				.should('have.length', PAGE_SIZE * 2)
				.eq(PAGE_SIZE)
				.should('have.focus')
				.and('contain.text', `Traveller ${PAGE_SIZE + 1}`)

			cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE)
				.should('have.text', TRAVELLERS_LIST_CONFIG.SHOW_MORE(6))
				.click()

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				30,
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.PAGE_STATUS).should(
				'have.text',
				TRAVELLERS_LIST_CONFIG.ALL_SHOWN(30, false),
			)
		})

		it('shows no paging controls for one page', () => {
			mountList({ travellers: alreadyLoaded() })

			cy.get(TRAVELLERS_LIST_SELECTORS.TRAVELLER_ITEM).should(
				'have.length',
				2,
			)
			cy.get(TRAVELLERS_LIST_SELECTORS.SHOW_MORE).should('not.exist')
			cy.get(TRAVELLERS_LIST_SELECTORS.PAGE_STATUS).should('not.exist')
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
