import { MemoryRouter } from 'react-router-dom'

import { PATHS } from '@/constants/ui'
import { TRAVELLERS_WELCOME_SELECTORS } from '@/constants/test'
import { TRAVELLERS_WELCOME_CONFIG } from '@/constants/travellers'

import TravellersWelcome from '@/components/travellers/travellers-welcome/TravellersWelcome'

const mountWelcome = () =>
	cy.mount(
		<MemoryRouter>
			<TravellersWelcome />
		</MemoryRouter>,
	)

describe('<TravellersWelcome />', () => {
	it('has no axe violations', () => {
		mountWelcome()
		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).should('be.visible')
		cy.checkA11y()
	})

	it('links to the sign-up form and the authentication page', () => {
		mountWelcome()

		cy.get(TRAVELLERS_WELCOME_SELECTORS.CREATE_ACCOUNT)
			.should('contain.text', TRAVELLERS_WELCOME_CONFIG.CREATE_ACCOUNT)
			.and('have.attr', 'href', `${PATHS.AUTHENTICATION}?mode=signup`)
		cy.get(TRAVELLERS_WELCOME_SELECTORS.LOG_IN)
			.should('contain.text', TRAVELLERS_WELCOME_CONFIG.LOG_IN)
			.and('have.attr', 'href', PATHS.AUTHENTICATION)
	})

	it('stacks the copy above the actions on a phone', () => {
		cy.viewport(375, 667)
		mountWelcome()

		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT)
			.should('have.css', 'display', 'flex')
			.and('have.css', 'flex-direction', 'column')
			.and('have.css', 'padding', '18px')
			.and('have.css', 'border-radius', '12px')
		cy.get(TRAVELLERS_WELCOME_SELECTORS.CREATE_ACCOUNT)
			.invoke('outerHeight')
			.should('be.gte', 44)
	})

	// The band sits in the list card, about 620px wide on desktop, where a row squeezed the heading onto three lines
	it('keeps the copy above the actions on desktop, with the heading on one line', () => {
		cy.viewport(1280, 800)
		cy.mount(
			<div style={{ width: 620 }}>
				<MemoryRouter>
					<TravellersWelcome />
				</MemoryRouter>
			</div>,
		)

		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).should(
			'have.css',
			'flex-direction',
			'column',
		)
		cy.get('h2').should(($heading) => {
			const lineHeight = parseFloat(
				getComputedStyle($heading[0]).lineHeight,
			)
			expect($heading[0].getBoundingClientRect().height).to.be.lessThan(
				lineHeight * 1.5,
			)
		})
		cy.get('h2').then(($heading) => {
			cy.get(TRAVELLERS_WELCOME_SELECTORS.CREATE_ACCOUNT).should(
				($link) => {
					expect(
						$link[0].getBoundingClientRect().top,
					).to.be.greaterThan(
						$heading[0].getBoundingClientRect().bottom,
					)
				},
			)
		})
	})
})
