import { PAGE_SELECTORS } from '../../support/constants/selectors/pages'
import { TRAVELLER_REGISTRATION_FORM_SELECTORS } from '../../support/constants/selectors/components'
import { BASE_URL_CYPRESS, PATHS } from '../../../src/constants/ui/paths'
import { VALIDATION_MESSAGES } from '../../../src/constants/validation/messages'

const registerUrl = BASE_URL_CYPRESS + PATHS.REGISTER

describe('Register Page', () => {
	beforeEach(() => {
		cy.visit(registerUrl)
	})

	it('renders the register page container', () => {
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).should('be.visible')
		cy.get(PAGE_SELECTORS.REGISTER_MAIN_CONTAINER).within(() => {
			cy.get('h2').should('contain', 'Register')
		})
	})

	it('renders the traveller registration form', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('be.visible')
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_INPUT).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.CHECKBOX_TOKYO).should(
			'be.visible',
		)
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SUBMIT_BUTTON).should(
			'be.visible',
		)
	})

	it('shows validation errors on empty submit', () => {
		cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SUBMIT_BUTTON).click()
		cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should(
			'be.visible',
		)
		cy.contains(VALIDATION_MESSAGES.LAST_NAME_REQUIRED).should('be.visible')
		cy.contains(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED).should(
			'be.visible',
		)
		cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('be.visible')
		cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('be.visible')
	})
})
