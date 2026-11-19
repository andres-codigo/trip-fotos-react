import { MemoryRouter } from 'react-router-dom'

import { FOOTER_SELECTORS } from '@/constants/test'

import Footer from '@/components/layout/footer/Footer'

describe('<Footer />', () => {
	it('has no axe violations', () => {
		cy.mount(
			<MemoryRouter>
				<Footer />
			</MemoryRouter>,
		)
		cy.get(FOOTER_SELECTORS.SITE_FOOTER).should('be.visible')
		cy.checkA11y()
	})
})
