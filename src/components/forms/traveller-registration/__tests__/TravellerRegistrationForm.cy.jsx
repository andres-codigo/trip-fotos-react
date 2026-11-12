import { BrowserRouter } from 'react-router-dom'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import { GLOBAL } from '@/constants/ui'

import {
	COMBOBOX_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MOCK_TRAVELLERS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
} from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'
import { TRIP_DATES_CONFIG } from '@/constants/travellers'

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
		// The uploader centres itself with auto margins, which a flex column would shrink to its text; 700px keeps it under its own 800px cap
		it('stretches the drop zone across the photos group, on Register and when editing', () => {
			cy.viewport(700, 900)
			;[
				{},
				{ initialTraveller: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE },
			].forEach((props) => {
				render(props)
				cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.PHOTOS).then(
					($fieldset) => {
						cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP)
							.invoke('outerWidth')
							.should('be.closeTo', $fieldset.outerWidth(), 1)
					},
				)
			})
		})

		it('has no axe violations', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM).should('exist')
			cy.checkA11y()
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
				.and('have.css', 'background-color', 'rgb(58, 34, 32)')

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

		it('keeps the photo file input hidden and inside the drop zone', () => {
			render()

			// `.formControl input` must not un-hide the visually hidden native input
			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT)
				.should('have.css', 'width', '1px')
				.and('have.css', 'border-top-width', '0px')
				.then(($input) => {
					cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP).then(($drop) => {
						const input = $input[0].getBoundingClientRect()
						const drop = $drop[0].getBoundingClientRect()

						expect(input.right).to.be.at.most(drop.right)
						expect(input.left).to.be.at.least(drop.left)
					})
				})
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
			cy.contains(VALIDATION_MESSAGES.TRIP_DESCRIPTION_REQUIRED).should(
				'exist',
			)
			cy.contains(VALIDATION_MESSAGES.TRIP_START_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.TRIP_END_REQUIRED).should('exist')
			cy.contains('p', VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'be.visible',
			)
			// The span is a screen-reader duplicate of the visible message
			cy.contains('span', VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'have.attr',
				'role',
				'alert',
			)
		})

		it('applies error styling to invalid fields', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT,
			).should('have.attr', 'aria-invalid', 'true')
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
			cy.contains(VALIDATION_MESSAGES.TRIP_DESCRIPTION_REQUIRED).should(
				'exist',
			)
			cy.contains(VALIDATION_MESSAGES.TRIP_START_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.TRIP_END_REQUIRED).should('exist')
			cy.contains(VALIDATION_MESSAGES.CITIES_REQUIRED).should('exist')
		})

		it('shows the trip length once both dates are entered', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_LENGTH).should(
				'have.text',
				TRIP_DATES_CONFIG.HINT,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				'2025-03-12',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
				'2025-03-19',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_LENGTH).should(
				'have.text',
				'8 days',
			)
		})

		it('flags an end date before the start date on the end date', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				'2025-03-19',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
				'2025-03-12',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).should(
				'have.attr',
				'aria-invalid',
				'true',
			)
			cy.contains(VALIDATION_MESSAGES.TRIP_END_BEFORE_START).should(
				'be.visible',
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_LENGTH).should(
				'have.text',
				TRIP_DATES_CONFIG.HINT,
			)
		})

		it('refuses a trip date in the future, and caps the calendar at today', () => {
			render()
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT)
				.should('have.attr', 'max')
				.and('match', /^\d{4}-\d{2}-\d{2}$/)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				'2999-01-01',
			)
			cy.contains(VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE).should(
				'be.visible',
			)
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
				TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
			)
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
				TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
			).type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
			)
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT).type(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
			)
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
	})

	describe('Accessibility tests', () => {
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
	})
})
