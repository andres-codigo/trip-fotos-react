import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import { MemoryRouter, useNavigate } from 'react-router-dom'

import { registerTraveller } from '@/store/slices/travellersSlice'
import { TEST_IDS } from '@/constants/test'
import { TRAVELLER_REGISTRATION_FORM_SELECTORS } from '@/constants/test/selectors/components'
import { GLOBAL, PATHS } from '@/constants/ui'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '@/constants/travellers'

import Register from '../Register'

import registerStyles from '../register.module.scss'

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		useNavigate: vi.fn(),
	}
})

// Mock travellersSlice
vi.mock('@/store/slices/travellersSlice', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		registerTraveller: vi.fn(),
	}
})

vi.mock(
	'@/components/forms/traveller-registration/TravellerRegistrationForm',
	() => ({
		default: ({ isLoading, onSubmit }) => (
			<div
				data-cy="traveller-registration-form"
				data-loading={isLoading ? 'true' : 'false'}>
				<button
					data-cy="mock-submit-button"
					onClick={() => onSubmit({ firstName: 'Test' })}>
					Mock Submit
				</button>
			</div>
		),
	}),
)

/**
 * Register Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container is rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the BaseCard component is rendered
 * - Checks that the TravellerRegistrationForm is rendered with correct props
 */

describe('Register', () => {
	const mockStore = configureStore([])
	let store
	const mockNavigate = vi.fn()

	beforeEach(() => {
		store = mockStore({
			travellers: {
				status: 'idle',
				error: null,
			},
		})
		store.dispatch = vi.fn()
		useNavigate.mockReturnValue(mockNavigate)
		// Default registerTraveller implementation to allow unwrap
		registerTraveller.mockReturnValue({ type: 'test' })

		vi.clearAllMocks()
	})

	const renderRegister = () => {
		render(
			<Provider store={store}>
				<MemoryRouter>
					<Register />
				</MemoryRouter>
			</Provider>,
		)
	}

	describe('Rendering tests', () => {
		it('renders the <main> element', () => {
			renderRegister()

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies both mainContainer and registerContainer classes to <main>', () => {
			renderRegister()

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(registerStyles.registerContainer),
			)
		})

		it('<main> element has correct data attributes', () => {
			renderRegister()

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.REGISTER.CONTAINER,
			)
		})

		it('renders the BaseCard component', () => {
			renderRegister()
			expect(screen.getByTestId(TEST_IDS.BASE_CARD)).toBeInTheDocument()
		})

		it('renders the TravellerRegistrationForm within BaseCard', () => {
			renderRegister()

			const baseCard = screen.getByTestId(TEST_IDS.BASE_CARD)
			expect(
				baseCard.querySelector(
					TRAVELLER_REGISTRATION_FORM_SELECTORS.FORM,
				),
			).toBeInTheDocument()
		})

		it('passes correct props to TravellerRegistrationForm', () => {
			renderRegister()

			const form = screen.getByTestId('traveller-registration-form')
			expect(form).toHaveAttribute('data-loading', 'false')
		})
	})

	describe('Behaviour tests', () => {
		it('should dispatch registerTraveller and navigate on success', async () => {
			const mockUnwrap = vi.fn().mockResolvedValue({})
			store.dispatch.mockReturnValue({ unwrap: mockUnwrap })

			renderRegister()

			const submitBtn = screen.getByTestId('mock-submit-button')
			fireEvent.click(submitBtn)

			// Should set loading to true
			await waitFor(() => {
				const form = screen.getByTestId('traveller-registration-form')
				expect(form).toHaveAttribute('data-loading', 'true')
			})

			expect(store.dispatch).toHaveBeenCalled()
			expect(registerTraveller).toHaveBeenCalledWith({
				firstName: 'Test',
			})
			expect(mockUnwrap).toHaveBeenCalled()

			// Should navigate after success
			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith(PATHS.TRAVELLERS, {
					state: {
						alertMessage: TRAVELLER_REGISTRATION_SUCCESS_MESSAGE,
					},
				})
			})

			// Should set loading back to false
			await waitFor(() => {
				const form = screen.getByTestId('traveller-registration-form')
				expect(form).toHaveAttribute('data-loading', 'false')
			})
		})

		it('should handle registration failure and show error', async () => {
			const errorMsg = 'Registration Failed'
			const mockUnwrap = vi.fn().mockRejectedValue(errorMsg)
			store.dispatch.mockReturnValue({ unwrap: mockUnwrap })

			renderRegister()

			const submitBtn = screen.getByTestId('mock-submit-button')
			fireEvent.click(submitBtn)

			expect(store.dispatch).toHaveBeenCalled()
			expect(registerTraveller).toHaveBeenCalled()

			// Should display error dialog
			await waitFor(() => {
				expect(
					screen.getByTestId('invalid-traveller-registration-dialog'),
				).toBeInTheDocument()
				expect(screen.getByText(errorMsg)).toBeInTheDocument()
			})

			// Should NOT navigate
			expect(mockNavigate).not.toHaveBeenCalled()

			// Should set loading back to false
			await waitFor(() => {
				const form = screen.getByTestId('traveller-registration-form')
				expect(form).toHaveAttribute('data-loading', 'false')
			})
		})

		it('should close error dialog when close button is clicked', async () => {
			const errorMsg = 'Registration Failed'
			const mockUnwrap = vi.fn().mockRejectedValue(errorMsg)
			store.dispatch.mockReturnValue({ unwrap: mockUnwrap })

			renderRegister()

			const submitBtn = screen.getByTestId('mock-submit-button')
			fireEvent.click(submitBtn)

			await waitFor(() => {
				expect(
					screen.getByTestId('invalid-traveller-registration-dialog'),
				).toBeInTheDocument()
			})

			// Find and click the close button within the dialog
			const closeButton = screen.getByRole('button', { name: /close/i })
			fireEvent.click(closeButton)

			// Verify the dialog is removed from the DOM
			await waitFor(() => {
				expect(
					screen.queryByTestId(
						'invalid-traveller-registration-dialog',
					),
				).not.toBeInTheDocument()
			})
		})
	})
})
