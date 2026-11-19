import configureTestStore from '@/testUtils/configureTestStore'

import { TAB_BAR_SELECTORS, mockConversationSummary } from '@/constants/test'
import { PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import TabBar from '@/components/layout/tab-bar/TabBar'

const USER_ID = 'traveller-uid'
const ACCENT_TEXT = 'rgb(169, 201, 138)'
const FOCUS = 'rgb(255, 243, 196)'

const reducer = {
	authentication: authenticationReducer,
	travellers: travellersReducer,
	messages: messagesReducer,
}

const createStore = ({ isTraveller, messages }) => {
	const initial = configureTestStore({ reducer }).getState()
	return configureTestStore({
		reducer,
		preloadedState: {
			authentication: {
				...initial.authentication,
				userId: USER_ID,
			},
			travellers: { ...initial.travellers, isTraveller },
			messages: { ...initial.messages, conversations: messages },
		},
	})
}

const mountTabBar = ({ path = PATHS.TRAVELLERS, messages = [] } = {}) =>
	cy.mountWithProviders(
		<TabBar />,
		createStore({ isTraveller: true, messages }),
		{ initialEntries: [path] },
	)

const beforeStyle = ($el, property) =>
	window.getComputedStyle($el[0], '::before').getPropertyValue(property)

describe('<TabBar />', () => {
	describe('Rendering tests', () => {
		// The bar covers the mobile range up to 768px inclusive
		;[
			[390, 844, true],
			[768, 1024, true],
			[1280, 800, false],
		].forEach(([width, height, shown]) => {
			it(`is ${shown ? 'docked to the bottom edge' : 'hidden'} at ${width}px`, () => {
				cy.viewport(width, height)
				mountTabBar()

				if (!shown) {
					cy.get(TAB_BAR_SELECTORS.ROOT).should('not.be.visible')
					cy.get(TAB_BAR_SELECTORS.SPACER).should('not.be.visible')
					return
				}
				cy.get(TAB_BAR_SELECTORS.ROOT)
					.should('be.visible')
					.and('have.css', 'position', 'fixed')
					.and('have.css', 'border-top-width', '1px')
					.and(($nav) => {
						const rect = $nav[0].getBoundingClientRect()
						expect(rect.left).to.equal(0)
						expect(rect.width).to.equal(width)
						expect(rect.bottom).to.equal(height)
					})
			})
		})

		it('holds a space in the page flow as tall as the bar, so the content above scrolls clear', () => {
			cy.viewport(390, 844)
			mountTabBar()

			cy.get(TAB_BAR_SELECTORS.ROOT).then(($bar) => {
				cy.get(TAB_BAR_SELECTORS.SPACER)
					.should('have.attr', 'aria-hidden', 'true')
					.invoke('outerHeight')
					.should('eq', $bar.outerHeight())
			})
		})

		it('gives every item an equal column and a 56px height', () => {
			cy.viewport(390, 844)
			mountTabBar()

			cy.get(`${TAB_BAR_SELECTORS.ROOT} a`)
				.should('have.length', 3)
				.each(($link) => {
					const rect = $link[0].getBoundingClientRect()
					expect(rect.height).to.equal(56)
					expect(rect.width).to.be.closeTo((390 - 8) / 3, 0.5)
				})
		})

		it('marks the current item with the accent colour and a top bar', () => {
			cy.viewport(390, 844)
			mountTabBar({ path: PATHS.MESSAGES })

			cy.get(TAB_BAR_SELECTORS.MESSAGES)
				.should('have.attr', 'aria-current', 'page')
				.and('have.css', 'color', ACCENT_TEXT)
				.and(($link) => {
					const width = $link[0].getBoundingClientRect().width
					expect(beforeStyle($link, 'top')).to.equal('0px')
					expect(beforeStyle($link, 'height')).to.equal('3px')
					expect(beforeStyle($link, 'background-color')).to.equal(
						ACCENT_TEXT,
					)
					expect(
						parseFloat(beforeStyle($link, 'width')),
					).to.be.closeTo(width * 0.4, 0.5)
				})

			cy.get(TAB_BAR_SELECTORS.TRAVELLERS)
				.should('not.have.css', 'color', ACCENT_TEXT)
				.and(($link) => {
					expect($link).not.to.have.attr('aria-current')
					expect(beforeStyle($link, 'background-color')).not.to.equal(
						ACCENT_TEXT,
					)
				})
		})

		it('places the unread pill at the top right of the Messages icon, with no axe violations', () => {
			cy.viewport(390, 844)
			mountTabBar({
				messages: [
					mockConversationSummary('m1', true),
					mockConversationSummary('m2', true),
				],
			})

			cy.checkA11y()
			cy.get(TAB_BAR_SELECTORS.UNREAD)
				.should('be.visible')
				.and(($pill) => {
					const pill = $pill[0].getBoundingClientRect()
					const icon = $pill[0].parentElement
						.querySelector('svg')
						.getBoundingClientRect()
					expect(pill.height).to.be.at.least(18)
					expect(pill.width).to.be.at.least(18)
					expect(pill.top).to.be.lessThan(icon.top)
					expect(pill.left).to.be.greaterThan(
						icon.left + icon.width / 2,
					)
				})
		})
	})

	describe('Behaviour tests', () => {
		beforeEach(() => {
			cy.viewport(390, 844)
		})

		it('moves through the items with Tab and draws the ring inside each', () => {
			mountTabBar()

			cy.get(TAB_BAR_SELECTORS.TRAVELLERS).focus()
			cy.press(Cypress.Keyboard.Keys.TAB)
			cy.get(TAB_BAR_SELECTORS.MESSAGES)
				.should('have.focus')
				.and('have.css', 'outline-color', FOCUS)
				.and(($link) => {
					expect(
						parseFloat($link.css('outline-offset')),
					).to.be.lessThan(0)
				})
			cy.press(Cypress.Keyboard.Keys.TAB)
			cy.get(TAB_BAR_SELECTORS.MY_TRIP).should('have.focus')
		})
	})
})
