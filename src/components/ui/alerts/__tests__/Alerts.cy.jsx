import Alerts from '@/components/ui/alerts/Alerts'

const ALERT = '[role="alert"]'
// Each type's token and its on-colour ink
const TYPE_COLOURS = {
	success: 'rgb(127, 196, 140)',
	error: 'rgb(229, 103, 93)',
	info: 'rgb(159, 192, 126)',
}

describe('<Alerts />', () => {
	;['success', 'error', 'info'].forEach((type) => {
		it(`draws the ${type} type with its token and on-colour ink`, () => {
			cy.mount(
				<Alerts
					message="Hello"
					type={type}
				/>,
			)

			cy.get(ALERT)
				.should('have.css', 'background-color', TYPE_COLOURS[type])
				.and('have.css', 'color', 'rgb(20, 19, 15)')
		})
	})

	;['success', 'error', 'info'].forEach((type) => {
		it(`has no axe violations for the ${type} type`, () => {
			cy.mount(
				<Alerts
					message="Hello"
					type={type}
					duration={0}
				/>,
			)

			// Axe measures colour contrast on what is painted, so wait for the fade-in to finish
			cy.get(ALERT).should('have.css', 'opacity', '1')
			cy.checkA11y()
		})
	})
})
