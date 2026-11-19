import { BrowserRouter } from 'react-router-dom'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'

import {
	COMBOBOX_SELECTORS,
	FILE_UPLOADER_SELECTORS,
	MOCK_TRAVELLERS,
	TRAVELLER_REGISTRATION_FORM_SELECTORS,
} from '@/constants/test'
import { VALIDATION_MESSAGES } from '@/constants/validation'

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

	// The one integration check: Vitest mocks useTravellerRegistration, so this runs the real hooks end to end
	describe('Integration through the real hooks', () => {
		it('shows the errors on an empty submit, then submits the photos with a valid form', () => {
			render()
			cy.get(
				TRAVELLER_REGISTRATION_FORM_SELECTORS.REGISTER_BUTTON,
			).click()

			cy.contains(VALIDATION_MESSAGES.FIRST_NAME_REQUIRED).should('exist')
			cy.contains('p', VALIDATION_MESSAGES.CITIES_REQUIRED).should(
				'be.visible',
			)
			cy.get(COMBOBOX_SELECTORS.INPUT)
				.should('have.attr', 'aria-invalid', 'true')
				.and('have.css', 'background-color', 'rgb(58, 34, 32)')
			cy.get('@onSubmit').should('not.have.been.called')

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

	describe('Layout', () => {
		it('keeps From and To on one line when only one has an error, at mobile and desktop widths', () => {
			const { TRIP_START_INPUT, TRIP_END_INPUT } =
				TRAVELLER_REGISTRATION_FORM_SELECTORS
			;[390, 1280].forEach((width) => {
				cy.viewport(width, 900)
				render()
				cy.get(TRIP_START_INPUT).type('2025-03-19')
				cy.get(TRIP_END_INPUT).type('2025-03-12').blur()
				cy.contains(VALIDATION_MESSAGES.TRIP_END_BEFORE_START).should(
					'be.visible',
				)
				cy.get(TRIP_START_INPUT).then(([from]) => {
					cy.get(TRIP_END_INPUT).then(([to]) => {
						expect(to.getBoundingClientRect().top).to.be.closeTo(
							from.getBoundingClientRect().top,
							1,
						)
					})
				})
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
	})
})
