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

	// Below 1024px the band stays stacked, even with room for a row
	it('keeps the copy above the actions at 1023px', () => {
		cy.viewport(1023, 800)
		mountWelcome()

		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).should(
			'have.css',
			'flex-direction',
			'column',
		)
	})

	// From 1024px the copy sits on the left and the actions on the right, Create an account above the Log in line
	it('puts the copy beside the actions from 1024px, with the heading on one line', () => {
		cy.viewport(1024, 800)
		mountWelcome()

		cy.get(TRAVELLERS_WELCOME_SELECTORS.ROOT).should(
			'have.css',
			'flex-direction',
			'row',
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
						$link[0].getBoundingClientRect().left,
					).to.be.greaterThan(
						$heading[0].getBoundingClientRect().right,
					)
				},
			)
		})
		cy.get(TRAVELLERS_WELCOME_SELECTORS.CREATE_ACCOUNT).then(($create) => {
			cy.get(TRAVELLERS_WELCOME_SELECTORS.LOG_IN).should(($logIn) => {
				expect($logIn[0].getBoundingClientRect().top).to.be.greaterThan(
					$create[0].getBoundingClientRect().bottom,
				)
			})
		})
	})
})
