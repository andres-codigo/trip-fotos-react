import { BrowserRouter } from 'react-router-dom'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import {
	COMBOBOX_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MOCK_TRAVELLERS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
} from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import travellerRegistrationFormStyles from '@/components/forms/traveller-registration/TravellerRegistrationForm.module.scss'

describe('<TravellerRegistrationForm />', () => {
	let onSubmit

	beforeEach(() => {
		onSubmit = cy.stub().as('onSubmit')
	})

	const render = (props = {}) => {
		cy.mount(
			<BrowserRouter>
				<TravellerRegistrationForm
					onSubmit={onSubmit}
					{...props}
				/>
			</BrowserRouter>,
		)
	}

	describe('Rendering tests', () => {
		it('renders the form', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('exist')
		})

		it('has no axe violations', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('exist')
			cy.checkA11y()
		})

		it('has all required fields', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT,
			).should('exist')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT,
			).should('exist')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT,
			).should('exist')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).should('exist')
			cy.get(COMBOBOX_SELECTORS.INPUT).should('exist')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).should('exist')
		})

		it('focuses the city search when its label is clicked', () => {
			render()
			cy.get('label[for="cities"]')
				.should('be.visible')
				.and('contain.text', GLOBAL.CITY_SEARCH_TEXT.LABEL)
				.click()
			cy.get(COMBOBOX_SELECTORS.INPUT).should('have.focus')
		})

		it('shows the required error when the city search is left empty', () => {
			render()
			cy.get('label[for="cities"]').click()
			cy.get(COMBOBOX_SELECTORS.INPUT).should('have.focus').blur()

			cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'be.visible',
			)
			cy.get(COMBOBOX_SELECTORS.INPUT)
				.should('have.attr', 'aria-invalid', 'true')
				.and('have.css', 'background-color', 'rgb(251, 233, 231)')

			cy.selectCity()
			cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('not.exist')
		})

		it('adds and removes cities through the search', () => {
			render()
			cy.selectCity()

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITY)
				.should('have.length', 1)
				.and('contain.text', 'Tokyo, Japan')
			cy.get(COMBOBOX_SELECTORS.INPUT).should('have.value', '')

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITY_REMOVE)
				.should('have.attr', 'aria-label', 'Remove Tokyo, Japan')
				.click()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITIES,
			).should('not.exist')
			cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('exist')
		})

		it('does not add a city from typed text alone', () => {
			cy.intercept(
				{ method: 'GET', hostname: 'photon.komoot.io' },
				{ statusCode: 200, body: { features: [] } },
			).as('citySearch')
			render()

			cy.get(COMBOBOX_SELECTORS.INPUT).type('Atlantis{enter}')
			cy.wait('@citySearch')

			cy.get(COMBOBOX_SELECTORS.STATUS).should(
				'have.text',
				GLOBAL.CITY_SEARCH_TEXT.NO_RESULTS,
			)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.SELECTED_CITIES,
			).should('not.exist')
			cy.get('@onSubmit').should('not.have.been.called')
		})

		it('shows an error when the city search fails', () => {
			cy.intercept(
				{ method: 'GET', hostname: 'photon.komoot.io' },
				{ statusCode: 500 },
			).as('citySearch')
			render()

			cy.get(COMBOBOX_SELECTORS.INPUT).type('tok')
			cy.wait('@citySearch')

			cy.get(COMBOBOX_SELECTORS.STATUS).should(
				'have.text',
				GLOBAL.CITY_SEARCH_TEXT.ERROR,
			)
		})

		it('renders the form with correct styling', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should(
				'have.class',
				travellerRegistrationFormStyles.travellerRegistration,
			)
		})
	})

	describe('Behaviour tests', () => {
		it('shows validation errors on empty submit', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.LAST_NAME_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED).should(
				'exist',
			)
			cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('exist')
			cy.contains('p', VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'be.visible',
			)
			cy.contains('span', VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'have.class',
				travellerRegistrationFormStyles.visuallyHidden,
			)
		})

		it('applies error styling to invalid fields', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			// Check if the parent div of the input has the invalidForm class
			// Note: We need to traverse up from the input to find the form control wrapper
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT)
				.closest(`.${travellerRegistrationFormStyles.formControl}`)
				.should(
					'have.class',
					travellerRegistrationFormStyles.invalidForm,
				)
		})

		it('clears validation error when input is corrected', () => {
			render()

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()
			cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should('exist')

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			)

			// Error should be gone
			cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should(
				'not.exist',
			)
			// Other errors should still exist
			cy.contains(VALIDATION_MESSAGES.LAST_NAME_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.DESCRIPTION_REQUIRED).should(
				'exist',
			)
			cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('exist')
		})

		it('validates days input is positive', () => {
			render()

			// Invalid input (0)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type('0')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.contains(VALIDATION_MESSAGES.DAYS_REQUIRED).should('exist')
		})

		it('successfully submits with valid data', () => {
			render()

			// Fill form
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
			)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.description)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity.toString())
			cy.selectCity()

			// Mock console.log to avoid cluttering test output, though we spy on onSubmit now
			cy.window().then((win) => {
				cy.spy(win.console, 'log').as('consoleLog')
			})

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			// Assert no errors
			cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should(
				'not.exist',
			)

			// Verify onSubmit was called via the hook's process
			// Since useTravellerRegistration manages the submit internally and then calls onSubmit,
			// we verify the form submission happened.
			// However, looking at the code: submitHandler(onSubmit) is passed to <form onSubmit=...>
			// If validation passes, submitHandler calls onSubmit(formData)

			// We can verify the stub was called
			cy.get('@onSubmit').should('have.been.called')
		})

		it('submits selected photos with the form', () => {
			render()

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
			)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DESCRIPTION_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.description)
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity.toString())
			cy.selectCity()

			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).selectFile(
				'cypress/fixtures/test-image.png',
				{ force: true },
			)
			cy.get(FILE_UPLOADER_SELECTORS.FILE_PREVIEW).should(
				'have.length',
				1,
			)

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.get('@onSubmit')
				.should('have.been.calledOnce')
				.its('firstCall.args.0.files')
				.should('have.length', 1)
				.its('0.name')
				.should('eq', 'test-image.png')
		})

		it('displays loading state correctly', () => {
			render({ isLoading: true })

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should(
				'have.attr',
				'aria-busy',
				'true',
			)

			cy.contains(ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE).should('exist')

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT,
			).should('be.disabled')

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).should('be.disabled')
		})
	})

	describe('Accessibility tests', () => {
		it('associates form with heading via aria-labelledby', () => {
			render()

			cy.get('#traveller-registration-title')
				.should('exist')
				.and('contain', 'Register as a Traveller')

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM)
				.should('have.attr', ACCESSIBILITY.ARIA_LABELLEDBY)
				.then((labelledby) => {
					cy.get(`#${labelledby}`).should('exist')
				})
		})

		it('marks required inputs with aria-required', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT,
			).should('have.attr', 'aria-required', 'true')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.LAST_NAME_INPUT,
			).should('have.attr', 'aria-required', 'true')
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			).should('have.attr', 'aria-required', 'true')
		})

		it('shows invalid state via aria-invalid and connects to error message', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT)
				.should('have.attr', 'aria-invalid', 'true')
				.and('have.attr', 'aria-describedby')
				.then((id) => {
					cy.get(`#${id}`).should('exist')
				})
		})

		it('announces loading state with aria-live region', () => {
			render({ isLoading: true })
			cy.contains(ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE).should(
				'have.attr',
				'aria-live',
				'polite',
			)
		})
	})
})
