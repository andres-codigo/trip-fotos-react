import Alerts from '@/components/ui/alerts/Alerts'

import alertsStyles from '@/components/ui/alerts/Alerts.module.scss'

const ALERT = '[role="alert"]'
const CLOSE_BUTTON = '[aria-label="Close message"]'

describe('<Alerts />', () => {
	it('announces the message as an alert', () => {
		cy.mount(<Alerts message="Saved." />)

		cy.get(ALERT).should('contain.text', 'Saved.')
	})

	;['success', 'error', 'info'].forEach((type) => {
		it(`styles the ${type} type`, () => {
			cy.mount(
				<Alerts
					message="Hello"
					type={type}
				/>,
			)

			cy.get(ALERT).should('have.class', alertsStyles[type])
		})
	})

	it('closes from the close button and reports it once the fade-out ends', () => {
		const onClose = cy.stub().as('onClose')
		cy.mount(
			<Alerts
				message="Hello"
				duration={0}
				onClose={onClose}
			/>,
		)

		cy.get(CLOSE_BUTTON).click()

		cy.get(ALERT).should('not.exist')
		cy.get('@onClose').should('have.been.calledOnce')
	})

	it('closes by itself after its duration', () => {
		const onClose = cy.stub().as('onClose')
		cy.clock()
		cy.mount(
			<Alerts
				message="Hello"
				duration={3000}
				onClose={onClose}
			/>,
		)

		cy.get(ALERT).should('exist')
		cy.tick(2999)
		cy.get('@onClose').should('not.have.been.called')
		cy.tick(1)

		cy.get(ALERT).should('not.exist')
		cy.get('@onClose').should('have.been.calledOnce')
	})

	it('stays open when the duration is 0', () => {
		cy.clock()
		cy.mount(
			<Alerts
				message="Hello"
				duration={0}
			/>,
		)

		cy.tick(60000)

		cy.get(ALERT).should('exist')
	})

	;['success', 'error'].forEach((type) => {
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
