import TravellerRegistrationForm from '../TravellerRegistrationForm'
import { TRAVELLER_REGISTRATION_FORM_SELECTORS } from '../../../../constants/test/selectors/components'
import { VALIDATION_MESSAGES } from '@/constants/validation/messages'

describe('<TravellerRegistrationForm />', () => {
	it('renders', () => {
		cy.mount(<TravellerRegistrationForm />)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('exist')
	})

	it('has all required fields', () => {
		cy.mount(<TravellerRegistrationForm />)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).should(
			'exist',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).should(
			'exist',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT).should(
			'exist',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_INPUT).should('exist')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.CHECKBOX_TOKYO).should(
			'exist',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SUBMIT_BUTTON).should(
			'exist',
		)
	})

	it('shows validation errors on empty submit', () => {
		cy.mount(<TravellerRegistrationForm />)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SUBMIT_BUTTON).click()
		cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should('exist')
		cy.contains(VALIDATION_MESSAGES.LAST_NAME_REQUIRED).should('exist')
		cy.contains(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED).should('exist')
		cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('exist')
		cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('exist')
	})
})
