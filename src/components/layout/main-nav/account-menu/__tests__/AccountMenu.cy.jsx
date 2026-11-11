import { ACCOUNT_MENU_SELECTORS } from '@/constants/test'
import { NAVIGATION } from '@/constants/ui'

import AccountMenu from '@/components/layout/main-nav/account-menu/AccountMenu'

const NAME = 'Ada Lovelace'

const mountMenu = (props = {}) =>
	cy.mount(
		<div className="flex justify-end bg-header p-4">
			<AccountMenu
				name={NAME}
				onLogOut={cy.stub().as('onLogOut')}
				{...props}
			/>
		</div>,
	)

const assertWithinViewport = (selector) =>
	cy.window().then((win) => {
		cy.get(selector).should(($el) => {
			const rect = $el[0].getBoundingClientRect()
			expect(rect.left).to.be.at.least(0)
			expect(rect.right).to.be.at.most(win.innerWidth)
		})
	})

const assertInitials = (initials) =>
	cy
		.get(ACCOUNT_MENU_SELECTORS.BUTTON)
		.find('[data-initials]')
		.should(($avatar) => {
			const { content } = window.getComputedStyle($avatar[0], '::before')
			expect(content).to.equal(`"${initials}"`)
		})

describe('<AccountMenu />', () => {
	describe('Rendering tests', () => {
		describe('Mobile (390px)', () => {
			beforeEach(() => {
				cy.viewport(390, 844)
			})

			it('shows a 44px borderless icon button with the initials only', () => {
				mountMenu()
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.should('be.visible')
					.find('[data-initials]')
					.should('be.visible')
				assertInitials('AL')
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.should('have.css', 'border-top-width', '0px')
					.and(($button) => {
						const rect = $button[0].getBoundingClientRect()
						expect(rect.width).to.be.closeTo(44, 0.5)
						expect(rect.height).to.be.closeTo(44, 0.5)
					})
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.contains('span', 'Ada')
					.should('not.be.visible')
			})

			it('opens a panel that stays on screen and has no axe violations', () => {
				mountMenu()
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
				cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('be.visible')
				cy.get(ACCOUNT_MENU_SELECTORS.SIGNED_IN_AS)
					.should('contain', NAVIGATION.SIGNED_IN_AS)
					.and('contain', NAME)
				assertWithinViewport(ACCOUNT_MENU_SELECTORS.PANEL)
				cy.checkA11y()
			})
		})

		describe('Desktop (1280px)', () => {
			beforeEach(() => {
				cy.viewport(1280, 800)
			})

			it('shows a bordered pill with the initials, first name and chevron', () => {
				mountMenu()
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.should('be.visible')
					.find('[data-initials]')
					.should('be.visible')
				assertInitials('AL')
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.should('contain', 'Ada')
					.and('have.css', 'border-top-width', '1px')
					.and(($button) => {
						expect(
							$button[0].getBoundingClientRect().height,
						).to.be.at.least(44)
					})
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
					.find('svg')
					.should('be.visible')
			})

			it('opens a right-aligned panel under the button', () => {
				mountMenu()
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).then(($button) => {
					const button = $button[0].getBoundingClientRect()
					cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should(($panel) => {
						const panel = $panel[0].getBoundingClientRect()
						expect(panel.top).to.be.greaterThan(button.bottom)
						expect(panel.right).to.be.closeTo(button.right, 0.5)
						expect(panel.width).to.be.closeTo(256, 0.5)
					})
				})
				cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).should(($logOut) => {
					expect(
						$logOut[0].getBoundingClientRect().height,
					).to.be.at.least(44)
				})
				cy.checkA11y()
			})

			it('shows the fallback label and no signed-in block without a name', () => {
				mountMenu({ name: '' })
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should(
					'contain',
					NAVIGATION.ACCOUNT_FALLBACK,
				)
				cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
				cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).should('be.visible')
				cy.get(ACCOUNT_MENU_SELECTORS.SIGNED_IN_AS).should('not.exist')
			})
		})
	})

	describe('Behaviour tests', () => {
		beforeEach(() => {
			cy.viewport(1280, 800)
		})

		it('draws the focus ring inside the button', () => {
			mountMenu()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).focus()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should(($button) => {
				expect(
					parseFloat($button.css('outline-offset')),
				).to.be.lessThan(0)
			})
		})

		it('moves focus into the panel with Tab and closes on Escape', () => {
			mountMenu()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).should(
				'have.attr',
				'aria-expanded',
				'true',
			)
			cy.press(Cypress.Keyboard.Keys.TAB)
			cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).should('have.focus')
			cy.focused().type('{esc}')
			cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('not.exist')
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON)
				.should('have.focus')
				.and('have.attr', 'aria-expanded', 'false')
		})

		it('logs out and closes', () => {
			mountMenu()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
			cy.get(ACCOUNT_MENU_SELECTORS.LOG_OUT).click()
			cy.get('@onLogOut').should('have.been.calledOnce')
			cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('not.exist')
		})

		it('closes on a click outside', () => {
			mountMenu()
			cy.get(ACCOUNT_MENU_SELECTORS.BUTTON).click()
			cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('be.visible')
			cy.get('html').click(10, 700)
			cy.get(ACCOUNT_MENU_SELECTORS.PANEL).should('not.exist')
		})
	})
})
