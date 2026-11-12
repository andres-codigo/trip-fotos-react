import { SHEET_SELECTORS } from '@/constants/test'

import BaseSheet from '@/components/ui/sheet/BaseSheet'

const mountSheet = (props = {}) =>
	cy.mount(
		<BaseSheet
			show
			title="Filter by city"
			onClose={cy.stub().as('onClose')}
			footer={<button type="button">Show all</button>}
			{...props}>
			<p>Sheet content</p>
		</BaseSheet>,
	)

describe('<BaseSheet />', () => {
	beforeEach(() => {
		cy.viewport(390, 844)
	})

	describe('Rendering tests', () => {
		it('has no axe violations', () => {
			mountSheet()
			cy.get(SHEET_SELECTORS.ROOT).should('be.visible')
			cy.checkA11y()
		})

		it('sits at the bottom of the viewport', () => {
			mountSheet()
			cy.get(SHEET_SELECTORS.ROOT).should(($sheet) => {
				const rect = $sheet[0].getBoundingClientRect()
				expect(rect.bottom).to.be.closeTo(844, 1)
			})
		})
	})

	describe('Behaviour tests', () => {
		it('calls onClose when Escape is pressed', () => {
			mountSheet()
			cy.get(SHEET_SELECTORS.ROOT).focus().type('{esc}')
			cy.get('@onClose').should('have.been.called')
		})
	})
})
