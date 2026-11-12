import {
	render,
	screen,
	fireEvent,
	waitFor,
	within,
} from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import configureTestStore from '@/testUtils/configureTestStore'
import { MemoryRouter, useNavigate } from 'react-router-dom'

import { registerTraveller } from '@/store/slices/travellersSlice'
import { TEST_IDS } from '@/constants/test'
import { PATHS } from '@/constants/ui'
import { TRAVELLER_REGISTRATION_SUCCESS_MESSAGE } from '@/constants/travellers'

import Register from '@/pages/register/Register'

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

const createMockStore = (initialState) => {
	return configureTestStore({
		reducer: {
			travellers: (
				state = { status: 'idle', error: null, uploadProgress: null },
			) => state,
		},
		preloadedState: initialState,
	})
}

describe('Register', () => {
	let store
	const mockNavigate = vi.fn()

	beforeEach(() => {
		store = createMockStore({
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

	it('renders the idle form in a card inside <main>', () => {
		renderRegister()

		const main = screen.getByRole('main')
		expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
		expect(main).toHaveAttribute('data-cy-alt', TEST_IDS.REGISTER.CONTAINER)
		const form = within(screen.getByTestId(TEST_IDS.BASE_CARD)).getByTestId(
			'traveller-registration-form',
		)
		expect(form).toHaveAttribute('data-loading', 'false')
	})

	describe('Upload progress', () => {
		const submitWhilePending = async (uploadProgress) => {
			store = createMockStore({
				travellers: { status: 'loading', error: null, uploadProgress },
			})
			store.dispatch = vi
				.fn()
				.mockReturnValue({ unwrap: () => new Promise(() => {}) })
			renderRegister()
			fireEvent.click(screen.getByTestId('mock-submit-button'))
			await screen.findByTestId('registering-dialog')
		}

		it('shows the spinner while no upload has started', async () => {
			await submitWhilePending(null)

			expect(screen.getByTestId('base-spinner')).toBeInTheDocument()
			expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
		})

		it('shows the progress bar and file count once uploading', async () => {
			await submitWhilePending({
				uploadedFiles: 2,
				totalFiles: 5,
				percent: 45,
			})

			expect(screen.getByRole('progressbar')).toHaveAttribute(
				'value',
				'45',
			)
			expect(
				screen.getByText('Uploading photos: 2 of 5 done (45%)'),
			).toBeInTheDocument()
			expect(screen.queryByTestId('base-spinner')).not.toBeInTheDocument()
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

		it('keeps the form busy while the upload is pending and navigates once it resolves', async () => {
			let resolveUpload
			store.dispatch.mockReturnValue({
				unwrap: () =>
					new Promise((resolve) => {
						resolveUpload = resolve
					}),
			})

			renderRegister()
			fireEvent.click(screen.getByTestId('mock-submit-button'))

			await screen.findByTestId('registering-dialog')
			expect(
				screen.getByTestId('traveller-registration-form'),
			).toHaveAttribute('data-loading', 'true')
			expect(mockNavigate).not.toHaveBeenCalled()

			resolveUpload({})

			await waitFor(() => expect(mockNavigate).toHaveBeenCalledOnce())
			expect(
				screen.queryByTestId('registering-dialog'),
			).not.toBeInTheDocument()
		})

		it('shows the error and frees the form when the upload fails part-way', async () => {
			const errorMsg = 'Upload interrupted'
			let rejectUpload
			store = createMockStore({
				travellers: {
					status: 'loading',
					error: null,
					uploadProgress: {
						uploadedFiles: 1,
						totalFiles: 3,
						percent: 33,
					},
				},
			})
			store.dispatch = vi.fn().mockReturnValue({
				unwrap: () =>
					new Promise((_, reject) => {
						rejectUpload = reject
					}),
			})

			renderRegister()
			fireEvent.click(screen.getByTestId('mock-submit-button'))
			await screen.findByTestId('registering-dialog')
			expect(screen.getByRole('progressbar')).toBeInTheDocument()

			rejectUpload(errorMsg)

			expect(
				await screen.findByTestId(
					'invalid-traveller-registration-dialog',
				),
			).toHaveTextContent(errorMsg)
			expect(
				screen.queryByTestId('registering-dialog'),
			).not.toBeInTheDocument()
			expect(
				screen.getByTestId('traveller-registration-form'),
			).toHaveAttribute('data-loading', 'false')
			expect(mockNavigate).not.toHaveBeenCalled()
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
