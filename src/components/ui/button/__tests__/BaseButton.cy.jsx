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

		it('keeps dark ink on the lighter red when hovering a danger button', () => {
			expectHover(BUTTON.MODE.DANGER, false, {
				color: 'rgb(20, 19, 15)',
				backgroundColor: 'rgb(238, 130, 121)',
			})
		})

		it('keeps moss text on the surface-accent hover of an outline link', () => {
			expectHover(BUTTON.MODE.OUTLINE, true, {
				color: 'rgb(169, 201, 138)',
				backgroundColor: 'rgb(44, 53, 35)',
			})
		})

		it('keeps dark ink on the lighter moss when hovering a primary link', () => {
			expectHover(BUTTON.MODE.PRIMARY, true, {
				color: 'rgb(20, 19, 15)',
				backgroundColor: 'rgb(179, 208, 148)',
			})
		})
	})
})
