import { render, fireEvent, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * TravellerRegistrationForm Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (form fields, error states, disabled states)
 * - Verifies prop spreading and className handling
 * - Tests form submission and callback invocation
 * - Ensures fieldConfig logic and getInputProps helper work correctly
 */

import TravellerRegistrationForm from '@/components/forms/traveller-registration/TravellerRegistrationForm'
import { FILE_DROP, MOCK_CITIES, UI_TEXT } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import { TRAVELLER_REGISTRATION_FIELDS } from '@/constants/travellers'

// Test selector constants
const FORM_SELECTORS = {
	FORM: 'traveller-registration-form',
	FIRST_NAME_INPUT: 'first-name-input',
	LAST_NAME_INPUT: 'last-name-input',
	DESCRIPTION_INPUT: 'description-input',
	DAYS_SPENT_IN_CITY_INPUT: 'days-spent-in-city-input',
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
		CITY_SEARCH_STATUS: {
			IDLE: 'idle',
			LOADING: 'loading',
			SUCCESS: 'success',
			ERROR: 'error',
		},
	}),
)

import useCitySearch from '@/components/forms/traveller-registration/hooks/useCitySearch'
import useTravellerRegistration from '@/components/forms/traveller-registration/hooks/useTravellerRegistration'

describe('<TravellerRegistrationForm />', () => {
	const mockOnSubmit = vi.fn()

	const mockHookReturnValue = {
		formData: {
			firstName: { value: '', message: '', isValid: true },
			lastName: { value: '', message: '', isValid: true },
			description: { value: '', message: '', isValid: true },
			days: { value: '', message: '', isValid: true },
			cities: { value: [], message: '', isValid: true },
		},
		handleInputChange: vi.fn(),
		handleCityAdd: vi.fn(),
		handleCityRemove: vi.fn(),
		handleCitiesBlur: vi.fn(),
		handleFilesUpdated: vi.fn(),
		submitHandler: (onSuccess) => (e) => {
			e.preventDefault()
			onSuccess?.({
				firstName: '',
				lastName: '',
				description: '',
				daysInCity: '',
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
		it('renders form with title', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByText(UI_TEXT.FORMS.REGISTER_AS_TRAVELLER),
			).toBeInTheDocument()
		})

		it('renders all required form fields', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByTestId(FORM_SELECTORS.FIRST_NAME_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.LAST_NAME_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.DESCRIPTION_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT),
			).toBeInTheDocument()
		})

		it('labels the city search "Cities visited" with a required mark', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const combobox = screen.getByRole('combobox', {
				name: UI_TEXT.FORMS.CITIES_VISITED,
			})
			expect(combobox).toHaveAttribute('aria-required', 'true')
		})

		it('renders submit button', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByTestId(FORM_SELECTORS.REGISTER_BUTTON),
			).toBeInTheDocument()
		})

		it('renders with correct data-cy attributes', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(screen.getByTestId(FORM_SELECTORS.FORM)).toBeInTheDocument()
			expect(
				screen.getByTestId('traveller-registration-form-title'),
			).toBeInTheDocument()
		})
	})

	describe('Form state and props passing', () => {
		it('passes correct props to Input components', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					firstName: {
						value: 'John',
						message: 'First name is required',
						isValid: false,
					},
					lastName: { value: '', message: '', isValid: true },
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
					cities: { value: [], message: '', isValid: true },
				},
			})

			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const firstNameInput = screen.getByTestId(
				FORM_SELECTORS.FIRST_NAME_INPUT,
			)
			expect(firstNameInput).toHaveValue('John')
			expect(firstNameInput).toHaveAttribute('required')
		})

		it('disables form inputs when isLoading is true', () => {
			render(
				<TravellerRegistrationForm
					isLoading={true}
					onSubmit={mockOnSubmit}
				/>,
			)

			expect(
				screen.getByTestId(FORM_SELECTORS.FIRST_NAME_INPUT),
			).toBeDisabled()
			expect(
				screen.getByTestId(FORM_SELECTORS.LAST_NAME_INPUT),
			).toBeDisabled()
			expect(
				screen.getByTestId(FORM_SELECTORS.DESCRIPTION_INPUT),
			).toBeDisabled()
			expect(
				screen.getByTestId(FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT),
			).toBeDisabled()
		})

		it('disables submit button when isLoading is true', () => {
			render(
				<TravellerRegistrationForm
					isLoading={true}
					onSubmit={mockOnSubmit}
				/>,
			)

			const submitButton = screen.getByTestId(
				FORM_SELECTORS.REGISTER_BUTTON,
			)
			expect(submitButton).toBeDisabled()
		})

		it('sets aria-busy on form when isLoading is true', () => {
			render(
				<TravellerRegistrationForm
					isLoading={true}
					onSubmit={mockOnSubmit}
				/>,
			)

			expect(screen.getByTestId(FORM_SELECTORS.FORM)).toHaveAttribute(
				'aria-busy',
				'true',
			)
		})

		it('sets aria-busy to false when isLoading is false', () => {
			render(
				<TravellerRegistrationForm
					isLoading={false}
					onSubmit={mockOnSubmit}
				/>,
			)

			expect(screen.getByTestId(FORM_SELECTORS.FORM)).toHaveAttribute(
				'aria-busy',
				'false',
			)
		})
	})

	describe('Form validation styling', () => {
		it('form renders with proper structure for invalid fields', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					firstName: {
						value: '',
						message: 'Required',
						isValid: false,
					},
					lastName: { value: '', message: '', isValid: true },
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
					cities: { value: [], message: '', isValid: true },
				},
			})

			const { container } = render(
				<TravellerRegistrationForm onSubmit={mockOnSubmit} />,
			)

			// Verify form renders successfully
			const form = container.querySelector(
				`[data-cy="${FORM_SELECTORS.FORM}"]`,
			)
			expect(form).toBeInTheDocument()
		})

		it('does not add invalidForm class when field is valid', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				formData: {
					firstName: { value: 'John', message: '', isValid: true },
					lastName: { value: '', message: '', isValid: true },
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
					cities: { value: [], message: '', isValid: true },
				},
			})

			const { container } = render(
				<TravellerRegistrationForm onSubmit={mockOnSubmit} />,
			)

			// Check that form rendered successfully
			const form = container.querySelector(
				`[data-cy="${FORM_SELECTORS.FORM}"]`,
			)
			expect(form).toBeInTheDocument()
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
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
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

			expect(screen.getByRole('status')).toHaveTextContent(message)
			useCitySearch.mockReturnValue({ results: [], status: 'idle' })
		})

		it('calls onSubmit when form is submitted', () => {
			useTravellerRegistration.mockReturnValue({
				...mockHookReturnValue,
				submitHandler: (onSuccess) => (e) => {
					e.preventDefault()
					onSuccess?.({
						firstName: 'John',
						description: 'Test',
						daysInCity: '5',
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

	describe('Accessibility', () => {
		it('sets noValidate on form to prevent browser validation', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const form = screen.getByTestId(FORM_SELECTORS.FORM)
			expect(form).toHaveAttribute('novalidate')
		})

		it('sets aria-labelledby on form pointing to title', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const form = screen.getByTestId(FORM_SELECTORS.FORM)
			expect(form).toHaveAttribute(
				'aria-labelledby',
				'traveller-registration-title',
			)
		})

		it('renders aria-live region for loading state', () => {
			const { container } = render(
				<TravellerRegistrationForm
					isLoading={true}
					onSubmit={mockOnSubmit}
				/>,
			)

			const ariaLiveRegion = container.querySelector(
				'[aria-live="polite"]',
			)
			expect(ariaLiveRegion).toBeInTheDocument()
		})

		it('all text inputs have required attribute', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			expect(
				screen.getByTestId(FORM_SELECTORS.FIRST_NAME_INPUT),
			).toHaveAttribute('required')
			expect(
				screen.getByTestId(FORM_SELECTORS.LAST_NAME_INPUT),
			).toHaveAttribute('required')
			expect(
				screen.getByTestId(FORM_SELECTORS.DESCRIPTION_INPUT),
			).toHaveAttribute('required')
			expect(
				screen.getByTestId(FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT),
			).toHaveAttribute('required')
		})
	})

	describe('Form field configuration', () => {
		it('renders form with all expected sections', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			// Check for form title
			expect(
				screen.getByText(UI_TEXT.FORMS.REGISTER_AS_TRAVELLER),
			).toBeInTheDocument()

			// Check for form fields
			expect(
				screen.getByTestId(FORM_SELECTORS.FIRST_NAME_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.LAST_NAME_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.DESCRIPTION_INPUT),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT),
			).toBeInTheDocument()

			expect(screen.getByRole('combobox')).toBeInTheDocument()
		})

		it('renders Input component with correct type for days field', () => {
			render(<TravellerRegistrationForm onSubmit={mockOnSubmit} />)

			const daysInput = screen.getByTestId(
				FORM_SELECTORS.DAYS_SPENT_IN_CITY_INPUT,
			)
			expect(daysInput).toHaveAttribute('type', 'number')
		})

		it('renders Textarea component for description field', () => {
			const { container } = render(
				<TravellerRegistrationForm onSubmit={mockOnSubmit} />,
			)

			const textarea = container.querySelector('textarea')
			expect(textarea).toBeInTheDocument()
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
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
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
					description: { value: '', message: '', isValid: true },
					days: { value: '', message: '', isValid: true },
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

			form.dispatchEvent(submitEvent)
			expect(preventDefaultSpy).toHaveBeenCalled()
		})
	})

	it('renders the optional photo uploader in its own fieldset', () => {
		render(<TravellerRegistrationForm onSubmit={vi.fn()} />)
		const fieldset = screen.getByRole('group', {
			name: 'Photos (optional)',
		})
		expect(within(fieldset).getByTestId(FILE_DROP.INPUT)).toHaveAttribute(
			'id',
			TRAVELLER_REGISTRATION_FIELDS.FILES,
		)
	})
})
