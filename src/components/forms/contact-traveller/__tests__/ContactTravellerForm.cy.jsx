import ContactTravellerForm from '@/components/forms/contact-traveller/ContactTravellerForm'

import { CONTACT_TRAVELLER_SELECTORS } from '@/constants/test'

describe('<ContactTravellerForm />', () => {
	it('has no axe violations, including with validation errors showing', () => {
		cy.mount(<ContactTravellerForm onSubmit={cy.stub()} />)
		cy.checkA11y()

		cy.get(CONTACT_TRAVELLER_SELECTORS.SUBMIT).click()
		cy.get(CONTACT_TRAVELLER_SELECTORS.MESSAGE_ERROR).should('exist')
		cy.checkA11y()
	})
})
