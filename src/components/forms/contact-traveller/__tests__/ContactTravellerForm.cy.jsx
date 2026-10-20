import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

describe('<ContactTravellerForm />', () => {
	it('shows validation errors for an empty form and does not submit', () => {
		const onSubmit = cy.stub().as('onSubmit')
		cy.mount(<ContactTravellerForm onSubmit={onSubmit} />)

		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()

		cy.get(CONTACT_TRAVELLER_SELECTORS.EMAIL_ERROR).should(
			'have.text',
			VALIDATION_MESSAGES.EMAIL_INVALID,
		)
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

	it('submits the prefilled email with the message', () => {
		const onSubmit = cy.stub().as('onSubmit')
		cy.mount(
			<ContactTravellerForm
				userEmail="me@example.com"
				onSubmit={onSubmit}
			/>,
		)

		cy.get(CONTACT_TRAVELLER_SELECTORS.EMAIL_INPUT)
			.should('have.value', 'me@example.com')
			.and('be.disabled')
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_INPUT).type('Hello there')
		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()

		cy.get('@onSubmit').should('have.been.calledOnceWith', {
			email: 'me@example.com',
			message: 'Hello there',
		})
	})
})
