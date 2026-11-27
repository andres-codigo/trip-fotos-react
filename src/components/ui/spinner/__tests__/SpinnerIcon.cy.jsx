import { COMMON_SELECTORS, TEST_IDS } from '@/constants/test'

import SpinnerIcon from '@/components/ui/spinner/SpinnerIcon'

const ICON = COMMON_SELECTORS.BASE_SPINNER_ICON

const emulateReducedMotion = (value) =>
	Cypress.automation('remote:debugger:protocol', {
		command: 'Emulation.setEmulatedMedia',
		params: { features: [{ name: 'prefers-reduced-motion', value }] },
	})

describe('<SpinnerIcon />', () => {
	afterEach(() => {
		cy.wrap(emulateReducedMotion(''))
	})
	;['md', 'sm'].forEach((size) => {
		it(`turns the ring with motion on at ${size}`, () => {
			cy.wrap(emulateReducedMotion('no-preference'))
			cy.mount(
				<SpinnerIcon
					size={size}
					data-cy={TEST_IDS.SPINNER.ICON}
				/>,
			)

			cy.get(ICON)
				.children()
				.first()
				.should('be.visible')
				.and('have.css', 'animation-name', 'spin')
			cy.get(ICON).children().eq(1).should('not.be.visible')
		})

		// A pulsing ring read as broken, so reduced motion swaps it for dots that only change opacity
		it(`shows three brightening dots in place of the ring under reduced motion at ${size}`, () => {
			cy.wrap(emulateReducedMotion('reduce'))
			cy.mount(
				<SpinnerIcon
					size={size}
					data-cy={TEST_IDS.SPINNER.ICON}
				/>,
			)

			cy.get(ICON).children().first().should('not.be.visible')
			cy.get(ICON)
				.children()
				.eq(1)
				.should('be.visible')
				.children()
				.should('have.length', 3)
				.each((dot) => {
					cy.wrap(dot).should(
						'have.css',
						'animation-name',
						'loading-dot',
					)
				})
		})
	})
})
