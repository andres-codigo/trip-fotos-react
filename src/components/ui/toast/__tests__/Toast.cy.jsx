import { TOAST_SELECTORS } from '@/constants/test'

import Toast from '@/components/ui/toast/Toast'

const MESSAGE = 'Message deleted.'

const mountToast = (props = {}) =>
	cy.mount(
		<Toast
			message={MESSAGE}
			actionLabel="Undo"
			onAction={cy.stub().as('onAction')}
			onClose={cy.stub().as('onClose')}
			{...props}
		/>,
	)

describe('<Toast />', () => {
	beforeEach(() => {
		cy.viewport(390, 844)
	})

	describe('Rendering tests', () => {
		it('has no axe violations', () => {
			mountToast()
			cy.get(TOAST_SELECTORS.ROOT).should('be.visible')
			cy.checkA11y()
		})

		it('renders the message, action and Dismiss button', () => {
			mountToast()
			cy.get(TOAST_SELECTORS.MESSAGE)
				.should('have.attr', 'role', 'status')
				.and('contain', MESSAGE)
			cy.get(TOAST_SELECTORS.ACTION).should('have.text', 'Undo')
			cy.get(TOAST_SELECTORS.DISMISS).should(
				'have.attr',
				'aria-label',
				'Dismiss',
			)
		})

		it('sits at the bottom centre of the viewport', () => {
			mountToast()
			cy.get(TOAST_SELECTORS.ROOT).should(($toast) => {
				const rect = $toast[0].getBoundingClientRect()
				expect(rect.bottom).to.be.closeTo(844 - 16, 1)
				expect(rect.left + rect.width / 2).to.be.closeTo(390 / 2, 1)
				expect(rect.width).to.be.closeTo(390 - 32, 1)
			})
		})
	})

	describe('Behaviour tests', () => {
		it('closes after the duration', () => {
			cy.clock()
			mountToast({ duration: 8000 })
			cy.get(TOAST_SELECTORS.ROOT).should('be.visible')
			cy.tick(7999)
			cy.get('@onClose').should('not.have.been.called')
			cy.tick(1)
			cy.get('@onClose').should('have.been.calledOnce')
		})

		it('pauses while hovered and resumes when the pointer leaves', () => {
			cy.clock()
			mountToast({ duration: 8000 })
			cy.get(TOAST_SELECTORS.ROOT).should('be.visible')
			cy.tick(3000)
			cy.get(TOAST_SELECTORS.MESSAGE).trigger('pointerover')
			cy.tick(20000)
			cy.get('@onClose').should('not.have.been.called')
			cy.get(TOAST_SELECTORS.MESSAGE).trigger('pointerout')
			cy.tick(4999)
			cy.get('@onClose').should('not.have.been.called')
			cy.tick(1)
			cy.get('@onClose').should('have.been.calledOnce')
		})

		it('calls onAction and not onClose when the action is clicked', () => {
			cy.clock()
			mountToast()
			cy.get(TOAST_SELECTORS.ACTION).click()
			cy.tick(20000)
			cy.get('@onAction').should('have.been.calledOnce')
			cy.get('@onClose').should('not.have.been.called')
		})

		it('calls onClose once when Dismiss is clicked', () => {
			mountToast()
			cy.get(TOAST_SELECTORS.DISMISS).click()
			cy.get('@onClose').should('have.been.calledOnce')
		})
	})
})
