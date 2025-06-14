import { MemoryRouter } from 'react-router-dom'

import { BUTTON } from '@/constants/test/button'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseButton from '@/components/ui/button/BaseButton'

describe('<BaseButton />', () => {
	describe('Rendering tests', () => {
		it('renders a button with children', () => {
			cy.mount(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
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
					data-cy={BUTTON.ID}>
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
						data-cy={BUTTON.LINK_ID}>
						Go to Test
					</BaseButton>
				</MemoryRouter>,
			)
			cy.get(getByDataCy(BUTTON.LINK_ID)).should(
				'have.attr',
				'href',
				'/test',
			)
		})

		it('applies custom className', () => {
			cy.mount(
				<BaseButton
					className="custom-class"
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
					Styled
				</BaseButton>,
			)
			cy.get(getByDataCy(BUTTON.ID)).should('have.class', 'custom-class')
		})
	})

	describe('Behaviour tests', () => {
		it('focuses button when isError is true', () => {
			cy.mount(
				<BaseButton
					isError
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
					Error
				</BaseButton>,
			)
			cy.get(getByDataCy(BUTTON.ID)).should('be.focused')
		})
	})

	describe('Accessibility tests', () => {
		it('adds aria-label when children is not a string', () => {
			cy.mount(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}
					aria-label="Custom label">
					<span
						role="img"
						aria-label="icon">
						🔥
					</span>
				</BaseButton>,
			)
			cy.get(getByDataCy(BUTTON.ID)).should(
				'have.attr',
				'aria-label',
				'Custom label',
			)
		})

		it('does not add aria-label when children is a string', () => {
			cy.mount(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
					Click me
				</BaseButton>,
			)
			cy.get(getByDataCy(BUTTON.ID)).should('not.have.attr', 'aria-label')
		})

		it('sets aria-disabled and tabIndex on link when disabled', () => {
			cy.mount(
				<MemoryRouter>
					<BaseButton
						isLink
						to="/test"
						isDisabled
						modeType={BUTTON.MODE.FLAT}
						data-cy={BUTTON.LINK_ID}>
						Go to Test
					</BaseButton>
				</MemoryRouter>,
			)
			cy.get(getByDataCy(BUTTON.LINK_ID))
				.should('have.attr', 'aria-disabled', 'true')
				.and('have.attr', 'tabindex', '-1')
		})
	})
})
