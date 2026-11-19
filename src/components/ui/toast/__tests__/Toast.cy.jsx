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

		it('sits at the bottom centre, 16px above the 61px tab bar on a phone', () => {
			mountToast()
			cy.get(TOAST_SELECTORS.ROOT).should(($toast) => {
				const rect = $toast[0].getBoundingClientRect()
				expect(rect.bottom).to.be.closeTo(844 - 61 - 16, 1)
				expect(rect.left + rect.width / 2).to.be.closeTo(390 / 2, 1)
				expect(rect.width).to.be.closeTo(390 - 32, 1)
			})
		})

		it('sits 16px above the bottom edge on desktop, where there is no tab bar', () => {
			cy.viewport(1280, 800)
			mountToast()
			cy.get(TOAST_SELECTORS.ROOT).should(($toast) => {
				expect($toast[0].getBoundingClientRect().bottom).to.be.closeTo(
					800 - 16,
					1,
				)
			})
		})
	})
})
