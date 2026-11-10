import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

describe('<ContactTravellerForm />', () => {
	it('has no axe violations, including with validation errors showing', () => {
		cy.mount(<ContactTravellerForm onSubmit={cy.stub()} />)
		cy.checkA11y()

		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_ERROR).should('exist')
		cy.checkA11y()
	})

	it('shows a validation error for an empty message and does not submit', () => {
		const onSubmit = cy.stub().as('onSubmit')
		cy.mount(<ContactTravellerForm onSubmit={onSubmit} />)

		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()

		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_ERROR).should(
			'have.text',
			VALIDATION_MESSAGES.MESSAGE_REQUIRED,
		)
		cy.get('@onSubmit').should('not.have.been.called')
	})

	it('clears the message error once text is entered', () => {
		cy.mount(<ContactTravellerForm onSubmit={cy.stub()} />)

		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type('Hello')
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_ERROR).should('not.exist')
	})

	it('has no email field and submits only the message', () => {
		const onSubmit = cy.stub().as('onSubmit')
		cy.mount(<ContactTravellerForm onSubmit={onSubmit} />)

		cy.get('input[type="email"]').should('not.exist')
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type('Hello there')
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()

		cy.get('@onSubmit').should('have.been.calledOnceWith', {
			message: 'Hello there',
		})
	})
})
