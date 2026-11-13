import { BrowserRouter } from 'react-router-dom'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import { GLOBAL } from '@/constants/ui'

import {
	COMBOBOX_SELECTORS,
	ERROR_SUMMARY_SELECTORS,
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

			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.FIRST_NAME_INPUT)
				.type(MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName)
				.should('have.attr', 'aria-invalid', 'false')

			// The field's own message goes; the summary keeps its entry until the next submit
			cy.get('#firstName-error').should('not.exist')
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
			// A new error shows once the field is left, not while typing
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_END_INPUT)
				.type('2025-03-12')
				.should('have.attr', 'aria-invalid', 'false')
				.blur()
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
			cy.get(TRAVELLER_REGISTRATION_FORM_SELECTORS.TRIP_START_INPUT)
				.type('2999-01-01')
				.blur()
			cy.contains(VALIDATION_MESSAGES.TRIP_DATE_IN_FUTURE).should(
				'be.visible',
			)
		})

		it('does not submit without a photo, and says so on the uploader and in the summary', () => {
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

			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.get(ERROR_SUMMARY_SELECTORS.LINK)
				.should('have.length', 1)
				.and('have.text', VALIDATION_MESSAGES.PHOTOS_REQUIRED)
			cy.get(FILE_UPLOADER_SELECTORS.FILE_DROP_INPUT).should(
				'have.attr',
				'aria-invalid',
				'true',
			)
			cy.get('@onSubmit').should('not.have.been.called')
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

	describe('Layout either side of 1024px', () => {
		const rect = (selector) =>
			cy.get(selector).then(($el) => $el[0].getBoundingClientRect())
		const { TRIP_DETAILS, PHOTOS_SECTION, ACTIONS } =
			TRAVELLER_REGISTRATION_FORM_SELECTORS

		it('stacks Trip details, Photos and the actions at 1023px', () => {
			cy.viewport(1023, 900)
			render({ initialTraveller: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE })
			rect(TRIP_DETAILS).then((details) => {
				rect(PHOTOS_SECTION).then((photos) => {
					expect(photos.left).to.be.closeTo(details.left, 1)
					expect(photos.width).to.be.closeTo(details.width, 1)
					expect(photos.top).to.be.at.least(details.bottom)
					rect(ACTIONS)
						.its('top')
						.should('be.at.least', photos.bottom)
				})
			})
			// One card below 1024px: the sections draw no edge of their own
			cy.get(TRIP_DETAILS).should('have.css', 'border-top-width', '0px')
			cy.contains('h2', 'Trip details').should('have.css', 'width', '1px')
		})

		it('puts Trip details in a 380px left column beside Photos from 1024px, with the actions under the photos', () => {
			cy.viewport(1024, 900)
			render({ initialTraveller: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE })
			rect(TRIP_DETAILS).then((details) => {
				expect(details.width).to.be.closeTo(380, 1)
				rect(PHOTOS_SECTION).then((photos) => {
					expect(photos.left - details.right).to.be.closeTo(24, 1)
					expect(photos.top).to.be.closeTo(details.top, 1)
					rect(ACTIONS).then((actions) => {
						expect(actions.top).to.be.at.least(photos.bottom)
						expect(actions.right).to.be.closeTo(photos.right, 1)
					})
				})
			})
			cy.get(TRIP_DETAILS).should('have.css', 'border-top-width', '1px')
			cy.contains('h2', 'Trip details').should('be.visible')
		})

		it('keeps the submit button last in tab order', () => {
			render()
			cy.get('form :is(input, button, textarea, a[href])')
				.last()
				.should('have.attr', 'data-cy', 'register-button')
		})
	})
})
