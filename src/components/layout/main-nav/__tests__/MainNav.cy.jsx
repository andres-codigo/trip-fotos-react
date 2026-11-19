import configureTestStore from '@/testUtils/configureTestStore'

import {
	ACCOUNT_MENU_SELECTORS,
	TOP_NAVIGATION_SELECTORS,
	mockConversationSummary,
} from '@/constants/test'
import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

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
				userId: USER_ID,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				travellerName: 'Ada Lovelace',
			},
			messages: {
				...messagesReducer(undefined, { type: '@@init' }),
				conversations: [mockConversationSummary('m1', true)],
			},
		},
	})

// The header's own frame, so the nav is measured where it sits in the app
const mountNav = () =>
	cy.mountWithProviders(
		<header className="fixed flex h-20 w-full items-center justify-between bg-header">
			<p className="px-6 text-2xl font-bold">Trip Fotos</p>
			<MainNav
				isLoggedIn
				isTraveller
			/>
		</header>,
		createStore(),
		{ initialEntries: [PATHS.TRAVELLERS] },
	)

describe('<MainNav />', () => {
	describe('Desktop', () => {
		beforeEach(() => {
			cy.viewport(1280, 800)
		})

		it('fills the header height with the inline items, then the account button', () => {
			mountNav()

			cy.get(TOP_NAVIGATION_SELECTORS.NAV_MENU_ITEM_TRAVELLERS)
				.invoke('outerHeight')
				.should('eq', 80)
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
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should(($button) => {
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
