import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import {
	ACCOUNT_MENU_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
} from '@/constants/test'
import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import TestLocationDisplay from '@/testUtils/cypress/TestLocationDisplay'

import MainNav from '@/components/layout/main-nav/MainNav'

const USER_ID = 'ada-uid'

const createStore = () =>
	configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
			messages: messagesReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token: 'token',
				userId: USER_ID,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				travellerName: 'Ada Lovelace',
			},
			messages: {
				...messagesReducer(undefined, { type: '@@init' }),
				messages: [{ id: 'm1', read: false }],
			},
		},
	})

// The header's own frame, so the nav is measured where it sits in the app
const mountNav = ({ path = PATHS.TRAVELLERS, isTraveller = true } = {}) =>
	cy.mount(
		<Provider store={createStore()}>
			<MemoryRouter initialEntries={[path]}>
				<header className="fixed flex h-20 w-full items-center justify-between bg-header">
					<p className="px-6 text-2xl font-bold">Trip Fotos</p>
					<MainNav
						isLoggedIn
						isTraveller={isTraveller}
					/>
				</header>
				<div className="pt-24">
					<TestLocationDisplay />
				</div>
			</MemoryRouter>
		</Provider>,
	)

describe('<MainNav />', () => {
	describe('Desktop', () => {
		beforeEach(() => {
			cy.viewport(1280, 800)
		})

		it('shows Travellers, Messages and My trip inline, then the account button', () => {
			mountNav()

			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER).should(
				'be.visible',
			)
			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_TRAVELLERS)
				.should('have.attr', 'aria-current', 'page')
				.invoke('outerHeight')
				.should('eq', 80)
			cy.get(TOP_NAVIGATION_SELECTORS.TOTAL_MESSAGES).should(
				'have.text',
				'1',
			)
			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MY_TRIP).then(
				($trip) => {
					cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
						.should('be.visible')
						.then(($account) => {
							expect(
								$account[0].getBoundingClientRect().left,
							).to.be.greaterThan(
								$trip[0].getBoundingClientRect().right,
							)
						})
				},
			)
			cy.checkA11y()
		})

		it('goes to each place from the nav', () => {
			mountNav()

			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES).click()
			cy.get('[data-cy="location-display"]').should(
				'have.text',
				PATHS.MESSAGES,
			)
			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MESSAGES).should(
				'have.attr',
				'aria-current',
				'page',
			)
			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_MY_TRIP).click()
			cy.get('[data-cy="location-display"]').should(
				'have.text',
				`${PATHS.TRAVELLERS}/${USER_ID}`,
			)
		})

		it('logs out from the account menu and lands on Log in', () => {
			mountNav()

			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
			cy.get(ACCOUNT_MENU_SELECTORS.SIGNED_IN_AS).should(
				'contain.text',
				'Ada Lovelace',
			)
			cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).click()
			cy.get('[data-cy="location-display"]').should(
				'have.text',
				PATHS.AUTHENTICATION,
			)
		})
	})

	describe('Mobile', () => {
		beforeEach(() => {
			cy.viewport(390, 844)
		})

		it('hides the inline nav and keeps the account button clear of the right edge', () => {
			mountNav()

			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_CONTAINER).should(
				'not.be.visible',
			)
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should('be.visible').focus()
			// The 3px ring sits inside the button, so the button's own box must stay on screen
			cy.focused()
				.should('have.css', 'outline-offset', '-3px')
				.then(($button) => {
					const { right, height } = $button[0].getBoundingClientRect()
					expect(right).to.be.at.most(390 - 8)
					expect(height).to.be.at.least(44)
				})
		})

		it('opens the account menu inside the viewport', () => {
			mountNav()

			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
			cy.get(ACCOUNT_MENU_SELECTORS.PANEL).then(($panel) => {
				const { left, right } = $panel[0].getBoundingClientRect()
				expect(left).to.be.at.least(0)
				expect(right).to.be.at.most(390)
			})
			cy.checkA11y()
		})
	})
})
