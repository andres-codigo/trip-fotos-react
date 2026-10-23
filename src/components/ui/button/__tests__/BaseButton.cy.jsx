import { MemoryRouter } from 'react-router-dom'

import { BUTTON } from '@/constants/test'

import { getByDataCy } from '@/testUtils/cypress/selectors'

import BaseButton from '@/components/ui/button/BaseButton'

// Cypress events never trigger :hover, so move the real mouse through the Chrome DevTools protocol
const realHover = (selector) =>
	cy.get(selector).then(($el) => {
		const { x, y, width, height } = $el[0].getBoundingClientRect()
		// The protocol takes top-window coordinates, but the app runs in a scaled iframe
		const frame = window.top.document.querySelector('.aut-iframe')
		const frameRect = frame.getBoundingClientRect()
		const scale = frameRect.width / frame.offsetWidth

		return Cypress.automation('remote:debugger:protocol', {
			command: 'Input.dispatchMouseEvent',
			params: {
				type: 'mouseMoved',
				x: frameRect.x + (x + width / 2) * scale,
				y: frameRect.y + (y + height / 2) * scale,
			},
		})
	})

describe('<BaseButton />', () => {
	describe('Rendering tests', () => {
		it('has no axe violations', () => {
			cy.mount(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
					Click me
				</BaseButton>,
			)
			cy.checkA11y()
		})

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

		it('renders as span when link is disabled (no href attribute)', () => {
			cy.mount(
				<MemoryRouter>
					<BaseButton
						isLink
						isDisabled
						to="/test"
						modeType={BUTTON.MODE.FLAT}
						data-cy={BUTTON.LINK_ID}>
						Disabled Link
					</BaseButton>
				</MemoryRouter>,
			)

			cy.get(getByDataCy(BUTTON.LINK_ID))
				.should('match', 'span')
				.and('have.attr', 'aria-disabled', 'true')
				.and('have.attr', 'tabindex', '-1')
				.and('not.have.attr', 'href')
		})

		it('renders as Link when isLink=true and not disabled', () => {
			cy.mount(
				<MemoryRouter>
					<BaseButton
						isLink
						to="/test"
						modeType={BUTTON.MODE.FLAT}
						data-cy={BUTTON.LINK_ID}>
						Enabled Link
					</BaseButton>
				</MemoryRouter>,
			)

			cy.get(getByDataCy(BUTTON.LINK_ID))
				.should('match', 'a')
				.and('have.attr', 'href', '/test')
				.and('not.have.attr', 'aria-disabled')
		})

		it('renders as button when isLink=false', () => {
			cy.mount(
				<BaseButton
					modeType={BUTTON.MODE.FLAT}
					data-cy={BUTTON.ID}>
					Button Text
				</BaseButton>,
			)
			cy.get(getByDataCy(BUTTON.ID)).should('match', 'button')
		})

		it('defaults to "/" when no to prop is provided for links', () => {
			cy.mount(
				<MemoryRouter>
					<BaseButton
						isLink
						modeType={BUTTON.MODE.FLAT}
						data-cy={BUTTON.LINK_ID}>
						Default Link
					</BaseButton>
				</MemoryRouter>,
			)
			cy.get(getByDataCy(BUTTON.LINK_ID)).should('have.attr', 'href', '/')
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

	describe('Hover tests', () => {
		const expectHover = (modeType, isLink, { color, backgroundColor }) => {
			cy.mount(
				<MemoryRouter>
					<div style={{ color: 'rgb(0, 0, 0)', padding: '1rem' }}>
						<BaseButton
							isLink={isLink}
							to="/somewhere"
							modeType={modeType}
							data-cy={BUTTON.ID}>
							Hover me
						</BaseButton>
					</div>
				</MemoryRouter>,
			)
			realHover(getByDataCy(BUTTON.ID))
			cy.get(getByDataCy(BUTTON.ID))
				.should('have.css', 'color', color)
				.and('have.css', 'background-color', backgroundColor)
		}

		it('keeps white text on a darker red when hovering a danger button', () => {
			expectHover(BUTTON.MODE.DANGER, false, {
				color: 'rgb(255, 255, 255)',
				backgroundColor: 'rgb(186, 1, 1)',
			})
		})

		it('keeps purple text on the pale hover background of an outline link', () => {
			expectHover(BUTTON.MODE.OUTLINE, true, {
				color: 'rgb(100, 12, 159)',
				backgroundColor: 'rgb(237, 210, 255)',
			})
		})

		it('keeps white text when hovering a primary link', () => {
			expectHover(BUTTON.MODE.PRIMARY, true, {
				color: 'rgb(255, 255, 255)',
				backgroundColor: 'rgb(100, 12, 159)',
			})
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

		it('sets proper accessibility attributes for disabled links', () => {
			cy.mount(
				<MemoryRouter>
					<BaseButton
						isLink
						isDisabled
						to="/test"
						modeType={BUTTON.MODE.FLAT}
						data-cy={BUTTON.LINK_ID}>
						Disabled Link
					</BaseButton>
				</MemoryRouter>,
			)
			cy.get(getByDataCy(BUTTON.LINK_ID))
				.should('have.attr', 'aria-disabled', 'true')
				.and('have.attr', 'tabindex', '-1')
				.and('not.have.attr', 'href')
		})
	})
})
