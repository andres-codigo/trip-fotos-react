import { MemoryRouter } from 'react-router-dom'

import { BUTTON } from '@/constants/test/button'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseButton from '@/components/ui/button/BaseButton'

describe('<BaseButton />', () => {
	it('renders a button with children', () => {
		cy.mount(
			<BaseButton
				modeType={BUTTON.MODE.FLAT}
				dataCypress={BUTTON.ID}>
				Click me
			</BaseButton>,
		)
		cy.get(getByDataCy(BUTTON.ID))
			.should('exist')
			.and('contain', 'Click me')
	})

	it('renders a disabled button', () => {
		cy.mount(
			<BaseButton
				isDisabled
				modeType={BUTTON.MODE.FLAT}
				dataCypress={BUTTON.ID}>
				Disabled
			</BaseButton>,
		)
		cy.get(getByDataCy(BUTTON.ID)).should('be.disabled')
	})

	it('renders a link when isLink is true', () => {
		cy.mount(
			<MemoryRouter>
				<BaseButton
					isLink
					to="/test"
					modeType={BUTTON.MODE.FLAT}
					dataCypress={BUTTON.LINK_ID}>
					Go to Test
				</BaseButton>
			</MemoryRouter>,
		)
		cy.get(getByDataCy(BUTTON.LINK_ID)).should('have.attr', 'href', '/test')
	})

	it('applies custom className', () => {
		cy.mount(
			<BaseButton
				className="custom-class"
				modeType={BUTTON.MODE.FLAT}
				dataCypress={BUTTON.ID}>
				Styled
			</BaseButton>,
		)
		cy.get(getByDataCy(BUTTON.ID)).should('have.class', 'custom-class')
	})

	it('focuses button when isError is true', () => {
		cy.mount(
			<BaseButton
				isError
				modeType={BUTTON.MODE.FLAT}
				dataCypress={BUTTON.ID}>
				Error
			</BaseButton>,
		)
		cy.get(getByDataCy(BUTTON.ID)).should('be.focused')
	})
})
