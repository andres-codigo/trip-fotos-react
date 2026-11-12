import { act, render, fireEvent, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'
import {
	ERROR_SUMMARY,
	FILE_DROP,
	MOCK_CITIES,
	REQUIRED_LEGEND,
	TRIP_PHOTOS,
	UI_TEXT,
} from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import {
	TRAVELLER_REGISTRATION_FIELDS,
	TRIP_DATES_CONFIG,
	TRIP_PHOTOS_CONFIG,
} from '@/constants/travellers'
import { VALIDATION_MESSAGES } from '@/constants/validation'

// Test selector constants
const FORM_SELECTORS = {
	FORM: 'traveller-registration-form',
	FIRST_NAME_INPUT: 'first-name-input',
	LAST_NAME_INPUT: 'last-name-input',
	TRIP_DESCRIPTION_INPUT: 'trip-description-input',
	TRIP_START_INPUT: 'trip-start-input',
	TRIP_END_INPUT: 'trip-end-input',
	TRIP_LENGTH: 'trip-length',
	REGISTER_BUTTON: 'register-button',
}

// Mock the hook to control form state in tests
vi.mock(
	'@/components/forms/traveller-registration/hooks/useTravellerRegistration',
	() => ({
		default: vi.fn(),
	}),
)

vi.mock(
	'@/components/forms/traveller-registration/hooks/useCitySearch',
	() => ({
		default: vi.fn(() => ({ results: [], status: 'idle' })),
	}),
)

import useCitySearch from '@/components/forms/traveller-registration/hooks/useCitySearch'
import useTravellerRegistration from '@/components/forms/traveller-registration/hooks/useTravellerRegistration'

describe('<TravellerRegistrationForm />', () => {
	const mockOnSubmit = vi.fn()

	const submitWith =
		(data) =>
		(onSuccess, { isExtraValid = true, onInvalid } = {}) =>
		(e) => {
			e.preventDefault()
			if (!isExtraValid) {
				onInvalid?.(mockHookReturnValue.formData)
				return
			}
			onSuccess?.(data)
		}

	const mockHookReturnValue = {
		formData: {
			firstName: { value: '', message: '', isValid: true },
			lastName: { value: '', message: '', isValid: true },
			tripDescription: { value: '', message: '', isValid: true },
			tripStart: { value: '', message: '', isValid: true },
			tripEnd: { value: '', message: '', isValid: true },
			cities: { value: [], message: '', isValid: true },
		},
		files: [],
		handleInputChange: vi.fn(),
		handleInputBlur: vi.fn(),
		handleCityAdd: vi.fn(),
		handleCityRemove: vi.fn(),
		handleCitiesBlur: vi.fn(),
		handleFilesUpdated: vi.fn(),
		submitHandler:
			(onSuccess, { isExtraValid = true, onInvalid } = {}) =>
			(e) => {
				e.preventDefault()
				if (!isExtraValid) {
					onInvalid?.(mockHookReturnValue.formData)
					return
				}
				onSuccess?.({
					firstName: '',
					lastName: '',
					tripDescription: '',
					tripStart: '',
					tripEnd: '',
					cities: [],
					files: [],
				})
			},
	}

	beforeEach(() => {
		vi.clearAllMocks()
		useTravellerRegistration.mockReturnValue(mockHookReturnValue)
	})

	describe('Rendering tests', () => {
		const FIELDS = [
			FORM_SELECTORS.FIRST_NAME_INPUT,
			FORM_SELECTORS.LAST_NAME_INPUT,
			FORM_SELECTORS.TRIP_DESCRIPTION_INPUT,
			FORM_SELECTORS.TRIP_START_INPUT,
			FORM_SELECTORS.TRIP_END_INPUT,
		]

		it('renders a titled, idle form whose fields are all required', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const form = screen.getByTestId(FORM_SELECTORS.FORM)
			expect(form).toHaveAttribute('novalidate')
			expect(form).toHaveAttribute('aria-busy', 'false')
			expect(form).toHaveAttribute(
				'aria-labelledby',
				'traveller-registration-title',
			)
			expect(
				screen.getByTestId('traveller-registration-form-title'),
			).toHaveTextContent(UI_TEXT.FORMS.REGISTER_AS_TRAVELLER)
			FIELDS.forEach((field) =>
				expect(screen.getByTestId(field)).toHaveAttribute('required'),
			)
			;[
				FORM_SELECTORS.FIRST_NAME_INPUT,
				FORM_SELECTORS.LAST_NAME_INPUT,
				FORM_SELECTORS.TRIP_START_INPUT,
				FORM_SELECTORS.TRIP_END_INPUT,
			].forEach((field) =>
				expect(screen.getByTestId(field)).toHaveAttribute(
					'aria-required',
					'true',
				),
			)
			expect(
				screen.getByRole('combobox', {
					name: UI_TEXT.FORMS.CITIES_VISITED,
				}),
			).toHaveAttribute('aria-required', 'true')
			expect(
				screen.getByTestId(FORM_SELECTORS.REGISTER_BUTTON),
			).toBeEnabled()
		})

		it('disables every field and the submit button, and announces the busy form, while loading', () => {
			const { container } = render(
				<TravellerRegistrationForm
					isLoading={true}
					onSubmit={mockOnSubmit}
				/>,
			)

			FIELDS.forEach((field) =>
				expect(screen.getByTestId(field)).toBeDisabled(),
			)
			expect(
				screen.getByTestId(FORM_SELECTORS.REGISTER_BUTTON),
			).toBeDisabled()
			expect(screen.getByTestId(FORM_SELECTORS.FORM)).toHaveAttribute(
				'aria-busy',
				'true',
			)
			expect(
				container.querySelector('[aria-live="polite"]'),
			).toBeInTheDocument()
		})
	})

	describe('Event handling', () => {
		it('calls handleInputChange when input value changes', () => {
			const mockHandleInputChange = vi.fn()
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				handleInputChange: mockHandleInputChange,
				formData: {
					firstName: { value: '', message: '', isValid: true },
					lastName: { value: '', message: '', isValid: true },
					tripDescription: { value: '', message: '', isValid: true },
					tripStart: { value: '', message: '', isValid: true },
					tripEnd: { value: '', message: '', isValid: true },
					cities: { value: [], message: '', isValid: true },
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const firstNameInput = screen.getByTestId(
				FORM_SELECTORS.FIRST_NAME_INPUT,
			)
			fireEvent.change(firstNameInput, { target: { value: 'John' } })

			expect(mockHandleInputChange).toHaveBeenCalled()
		})

		it('adds a city chosen from the search results', () => {
			const mockHandleCityAdd = vi.fn()
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				handleCityAdd: mockHandleCityAdd,
			})
			useCitySearch.mockReturnValue({
				results: [MOCK_CITIES.TOKYO],
				status: 'success',
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const combobox = screen.getByRole('combobox', {
				name: GLOBAL.CITY_SEARCH_TEXT.LABEL,
			})
			fireEvent.change(combobox, { target: { value: 'tok' } })
			expect(
				screen.getByText(GLOBAL.CITY_SEARCH_TEXT.RESULTS(1)),
			).toBeInTheDocument()
			fireEvent.click(
				screen.getByRole('option', { name: 'Tokyo, Japan' }),
			)

			expect(mockHandleCityAdd).toHaveBeenCalledWith(MOCK_CITIES.TOKYO)
			useCitySearch.mockReturnValue({ results: [], status: 'idle' })
		})

		it.each([
			['loading', GLOBAL.CITY_SEARCH_TEXT.LOADING],
			['error', GLOBAL.CITY_SEARCH_TEXT.ERROR],
			['success', GLOBAL.CITY_SEARCH_TEXT.NO_RESULTS],
		])('shows the %s search status', (status, message) => {
			useCitySearch.mockReturnValue({ results: [], status })

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen
					.getAllByRole('status')
					.some((region) => region.textContent.includes(message)),
			).toBe(true)
			useCitySearch.mockReturnValue({ results: [], status: 'idle' })
		})

		it('calls onSubmit when form is submitted', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				submitHandler: (onSuccess) => (e) => {
					e.preventDefault()
					onSuccess?.({
						firstName: 'John',
						tripDescription: 'Test',
						tripStart: '2025-03-12',
						tripEnd: '2025-03-16',
						cities: ['Tokyo'],
						files: [],
					})
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const form = screen.getByTestId(FORM_SELECTORS.FORM)
			fireEvent.submit(form)

			expect(mockOnSubmit).toHaveBeenCalled()
		})
	})

	describe('Form field configuration', () => {
		it('renders the trip dates as two date inputs in a "Trip dates" group, capped at today', () => {
			vi.useFakeTimers({ toFake: ['Date'] })
			vi.setSystemTime(new Date(2026, 10, 11, 12, 0))
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)
			vi.useRealTimers()

			const group = screen.getByRole('group', { name: /Trip dates/ })
			const from = within(group).getByLabelText(/^From/)
			const to = within(group).getByLabelText(/^To/)

			for (const input of [from, to]) {
				expect(input).toHaveAttribute('type', 'date')
				expect(input).toHaveAttribute('max', '2026-11-11')
				expect(input).toHaveAttribute(
					'aria-describedby',
					'trip-dates-hint',
				)
			}
			expect(
				screen.getByTestId(FORM_SELECTORS.TRIP_LENGTH),
			).toHaveTextContent(TRIP_DATES_CONFIG.HINT)
		})

		it('shows the trip length once both dates are valid', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					...mockHookReturnValue.formData,
					tripStart: {
						value: '2025-03-12',
						message: '',
						isValid: true,
					},
					tripEnd: {
						value: '2025-03-19',
						message: '',
						isValid: true,
					},
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByTestId(FORM_SELECTORS.TRIP_LENGTH),
			).toHaveTextContent('8 days')
		})

		it('shows the hint, not a length, and links the error while a date is invalid', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					...mockHookReturnValue.formData,
					tripStart: {
						value: '2025-03-19',
						message: '',
						isValid: true,
					},
					tripEnd: {
						value: '2025-03-12',
						message: VALIDATION_MESSAGES.TRIP_END_BEFORE_START,
						isValid: false,
					},
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByTestId(FORM_SELECTORS.TRIP_LENGTH),
			).toHaveTextContent(TRIP_DATES_CONFIG.HINT)
			const to = screen.getByTestId(FORM_SELECTORS.TRIP_END_INPUT)
			expect(to).toHaveAttribute('aria-invalid', 'true')
			expect(to).toHaveAttribute(
				'aria-describedby',
				'trip-dates-hint tripEnd-error',
			)
			expect(document.getElementById('tripEnd-error')).toHaveTextContent(
				VALIDATION_MESSAGES.TRIP_END_BEFORE_START,
			)
		})

		it('labels the trip description textarea "About your trip"', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(screen.getByLabelText(/About your trip/)).toBe(
				screen.getByTestId(FORM_SELECTORS.TRIP_DESCRIPTION_INPUT),
			)
		})
	})

	describe('Error message rendering', () => {
		it('renders visually hidden error for invalid first name', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					firstName: {
						value: '',
						message: 'First name is required',
						isValid: false,
					},
					lastName: { value: '', message: '', isValid: true },
					tripDescription: { value: '', message: '', isValid: true },
					tripStart: { value: '', message: '', isValid: true },
					tripEnd: { value: '', message: '', isValid: true },
					cities: { value: [], message: '', isValid: true },
				},
			})

			const { container } = render(
				<TravellerRegistrationForm onSubmit={mockOnSubmit} />,
			)

			const errorElement = container.querySelector(
				'[id="first-name-error"]',
			)
			expect(errorElement).toBeInTheDocument()
		})

		it('renders cities error message when cities are invalid', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					firstName: { value: '', message: '', isValid: true },
					lastName: { value: '', message: '', isValid: true },
					tripDescription: { value: '', message: '', isValid: true },
					tripStart: { value: '', message: '', isValid: true },
					tripEnd: { value: '', message: '', isValid: true },
					cities: {
						value: [],
						message: 'Select at least one city',
						isValid: false,
					},
				},
			})

			const { container } = render(
				<TravellerRegistrationForm onSubmit={mockOnSubmit} />,
			)

			// Check for visible error message
			const visibleError = container.querySelector('[id="cities-error"]')
			expect(visibleError).toBeInTheDocument()
			expect(visibleError?.textContent).toContain(
				'Select at least one city',
			)

			// Check for visually hidden error
			const hiddenError = container.querySelector(
				'[id="cities-error-hidden"]',
			)
			expect(hiddenError).toBeInTheDocument()
		})
	})

	describe('Selected cities', () => {
		it('lists legacy and searched cities with remove buttons', () => {
			const mockHandleCityRemove = vi.fn()
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				handleCityRemove: mockHandleCityRemove,
				formData: {
					...mockHookReturnValue.formData,
					cities: {
						value: ['tokyo', MOCK_CITIES.PRAGUE],
						message: '',
						isValid: true,
					},
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const list = screen.getByRole('list', {
				name: GLOBAL.CITY_SEARCH_TEXT.SELECTED_LABEL,
			})
			expect(list).toHaveTextContent('Tokyo, Japan')
			expect(list).toHaveTextContent('Prague, Czechia')

			fireEvent.click(
				screen.getByRole('button', {
					name: GLOBAL.REMOVE_CITY_LABEL('Tokyo, Japan'),
				}),
			)
			expect(mockHandleCityRemove).toHaveBeenCalledWith('tokyo')

			fireEvent.click(
				screen.getByRole('button', {
					name: GLOBAL.REMOVE_CITY_LABEL('Prague, Czechia'),
				}),
			)
			expect(mockHandleCityRemove).toHaveBeenCalledWith(
				MOCK_CITIES.PRAGUE.id,
			)
		})

		it('shows no list before a city is chosen', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)
			expect(
				screen.queryByRole('list', {
					name: GLOBAL.CITY_SEARCH_TEXT.SELECTED_LABEL,
				}),
			).toBeNull()
		})

		it('links the cities error to the search input', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					...mockHookReturnValue.formData,
					cities: {
						value: [],
						message: 'Select at least one city',
						isValid: false,
					},
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const combobox = screen.getByRole('combobox')
			expect(combobox).toHaveAttribute('aria-invalid', 'true')
			expect(combobox.getAttribute('aria-describedby')).toContain(
				'cities-error',
			)
		})
	})

	describe('Form submission', () => {
		it('prevents default form submission', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const form = screen.getByTestId('traveller-registration-form')
			const submitEvent = new Event('submit', { bubbles: true })
			const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

			act(() => {
				form.dispatchEvent(submitEvent)
			})
			expect(preventDefaultSpy).toHaveBeenCalled()
		})
	})

	it('renders the required photo uploader with its rule up front, in its own fieldset', () => {
		render(<TravellerRegistrationForm onSubmit={vi.fn()} />)
		const fieldset = screen.getByRole('group', {
			name: TRIP_PHOTOS_CONFIG.LEGEND,
		})
		const input = within(fieldset).getByTestId(FILE_DROP.INPUT)
		expect(input).toHaveAttribute('id', TRAVELLER_REGISTRATION_FIELDS.FILES)
		expect(input).toHaveAccessibleDescription(TRIP_PHOTOS_CONFIG.HELP)
		expect(screen.getByTestId(REQUIRED_LEGEND.ROOT)).toBeInTheDocument()
	})

	it('refuses a trip with no photo, listing every problem in a focused summary in field order', () => {
		const formData = {
			...mockHookReturnValue.formData,
			firstName: {
				value: '',
				isValid: false,
				message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
			},
			cities: {
				value: [],
				isValid: false,
				message: VALIDATION_MESSAGES.CITIES_REQUIRED,
			},
		}
		useTravellerRegistration.mockReturnValue({
			...mockHookReturnValue,
			formData,
			submitHandler:
				(_, { onInvalid }) =>
				(e) => {
					e.preventDefault()
					onInvalid(formData)
				},
		})
		render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

		fireEvent.submit(screen.getByTestId(FORM_SELECTORS.FORM))

		const summary = screen.getByTestId(ERROR_SUMMARY.ROOT)
		expect(summary).toHaveFocus()
		expect(
			within(summary)
				.getAllByRole('link')
				.map((link) => [link.textContent, link.getAttribute('href')]),
		).toEqual([
			[VALIDATION_MESSAGES.FIRST_NAME_REQUIRED, '#firstName'],
			[VALIDATION_MESSAGES.CITIES_REQUIRED, '#cities'],
			[VALIDATION_MESSAGES.PHOTOS_REQUIRED, '#files'],
		])
		expect(screen.getByTestId(FILE_DROP.INPUT)).toHaveAttribute(
			'aria-invalid',
			'true',
		)
		expect(mockOnSubmit).not.toHaveBeenCalled()
	})

	describe('Editing a trip', () => {
		const photo = (n, alt = '') => ({
			url: `https://img/${n}.jpg`,
			dimensions: { width: 4, height: 3 },
			thumbnails: null,
			alt,
		})
		const traveller = (count) => ({
			firstName: 'Amara',
			files: Array.from({ length: count }, (_, i) => photo(i).url),
			fileDimensions: Array.from(
				{ length: count },
				(_, i) => photo(i).dimensions,
			),
		})
		const fields = {
			firstName: 'Amara',
			lastName: '',
			tripDescription: '',
			tripStart: '',
			tripEnd: '',
			cities: [],
		}
		const withFiles = (files) => ({
			...mockHookReturnValue,
			files,
			submitHandler: submitWith({ ...fields, files }),
		})
		const renderEdit = (props = {}) =>
			render(
				<TravellerRegistrationForm
					onSubmit={mockOnSubmit}
					initialTraveller={traveller(3)}
					title="Edit your trip"
					submitLabel="Save changes"
					actions={<a href="/travellers/me">Cancel</a>}
					{...props}
				/>,
			)
		const submit = () =>
			fireEvent.submit(screen.getByTestId(FORM_SELECTORS.FORM))

		beforeEach(() => {
			useTravellerRegistration.mockReturnValue(withFiles([]))
		})

		it('starts the hook from the traveller', () => {
			renderEdit()
			expect(useTravellerRegistration).toHaveBeenCalledWith(
				expect.objectContaining({ firstName: 'Amara' }),
			)
		})

		it('uses the given title, submit label and extra actions', () => {
			renderEdit()
			expect(
				screen.getByRole('heading', {
					level: 1,
					name: 'Edit your trip',
				}),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.REGISTER_BUTTON),
			).toHaveTextContent('Save changes')
			expect(
				screen.getByRole('link', { name: 'Cancel' }),
			).toBeInTheDocument()
		})

		it('lists the photos already on the trip above the uploader, under "Photos"', () => {
			renderEdit()
			const fieldset = screen.getByRole('group', {
				name: TRIP_PHOTOS_CONFIG.LEGEND,
			})
			expect(fieldset).toHaveAttribute('id', 'photos')
			expect(
				within(fieldset).getAllByTestId(TRIP_PHOTOS.TILE),
			).toHaveLength(3)
			expect(
				within(fieldset).getByTestId(FILE_DROP.INPUT),
			).toBeInTheDocument()
		})

		it('submits the kept and the removed photos apart', () => {
			renderEdit()
			fireEvent.click(screen.getAllByTestId(TRIP_PHOTOS.REMOVE)[1])
			submit()

			expect(mockOnSubmit).toHaveBeenCalledWith({
				...fields,
				files: [],
				keptPhotos: [photo(0), photo(2)],
				removedPhotos: [photo(1)],
			})
		})

		it('puts a removed photo back on Undo', () => {
			renderEdit()
			fireEvent.click(screen.getAllByTestId(TRIP_PHOTOS.REMOVE)[0])
			fireEvent.click(screen.getByTestId(TRIP_PHOTOS.UNDO))
			submit()

			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					keptPhotos: [photo(0), photo(1), photo(2)],
					removedPhotos: [],
				}),
			)
		})

		it('refuses to save a trip left with no photos', () => {
			// One new file lets the last photo go; the file is then gone by submit
			useTravellerRegistration.mockReturnValueOnce(
				withFiles([{ id: 'new' }]),
			)
			renderEdit({ initialTraveller: traveller(1) })
			fireEvent.click(screen.getByTestId(TRIP_PHOTOS.REMOVE))
			submit()

			expect(mockOnSubmit).not.toHaveBeenCalled()
			expect(screen.getByTestId('photos-error')).toHaveTextContent(
				VALIDATION_MESSAGES.PHOTOS_REQUIRED,
			)
		})

		it('asks an older trip that never had photos for one before it saves', () => {
			renderEdit({ initialTraveller: { firstName: 'Kofi' } })
			submit()

			expect(mockOnSubmit).not.toHaveBeenCalled()
			expect(screen.getByTestId(ERROR_SUMMARY.ROOT)).toHaveTextContent(
				VALIDATION_MESSAGES.PHOTOS_REQUIRED,
			)
		})

		it('saves the description written for a photo on the trip', () => {
			renderEdit()
			fireEvent.change(screen.getAllByTestId(TRIP_PHOTOS.ALT_INPUT)[1], {
				target: { value: 'Old Town Square' },
			})
			submit()

			expect(mockOnSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					keptPhotos: [
						photo(0),
						photo(1, 'Old Town Square'),
						photo(2),
					],
				}),
			)
		})

		it('focuses the uploader when opened from "Add photos"', () => {
			renderEdit({ focusPhotos: true })
			expect(screen.getByTestId(FILE_DROP.INPUT)).toHaveFocus()
		})

		it('leaves focus alone otherwise', () => {
			renderEdit()
			expect(screen.getByTestId(FILE_DROP.INPUT)).not.toHaveFocus()
		})

		it('submits Register data unchanged, with no photo lists', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				files: [{ id: 'new' }],
			})
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)
			submit()

			expect(mockOnSubmit.mock.calls[0][0]).not.toHaveProperty(
				'keptPhotos',
			)
		})
	})
})
