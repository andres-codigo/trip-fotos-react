import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import configureTestStore from '@/testUtils/configureTestStore'
import { MemoryRouter, useNavigate } from 'react-router-dom'

import { registerTraveller } from '@/store/slices/travellersSlice'
import { TEST_IDS, VERIFY_EMAIL_NOTE } from '@/constants/test'
import { VERIFY_EMAIL_PROMPT_CONFIG } from '@/constants/auth'
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
				<button onClick={() => onSubmit({ firstName: 'Test' })}>
					Mock Submit
				</button>
			</div>
		),
	}),
)

const createMockStore = (initialState, emailVerified = true) => {
	return configureTestStore({
		reducer: {
			authentication: (
				state = { emailVerified, userEmail: 'me@example.com' },
			) => state,
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

	const submit = () =>
		fireEvent.click(screen.getByRole('button', { name: 'Mock Submit' }))
	const getForm = () => screen.getByTestId(TEST_IDS.REGISTER.FORM)

	const renderRegister = () => {
		render(
			<Provider store={store}>
				<MemoryRouter>
					<Register />
				</MemoryRouter>
			</Provider>,
		)
	}

	it('renders the idle form inside <main>', () => {
		renderRegister()

		const main = screen.getByRole('main')
		expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
		expect(main).toHaveAttribute('data-cy-alt', TEST_IDS.REGISTER.CONTAINER)
		expect(getForm()).toHaveAttribute('data-loading', 'false')
	})

	it('shows the verify note instead of the form for an unverified account', () => {
		store = createMockStore(
			{ travellers: { status: 'idle', error: null } },
			false,
		)
		renderRegister()

		expect(screen.getByTestId(VERIFY_EMAIL_NOTE.ROOT)).toHaveTextContent(
			VERIFY_EMAIL_PROMPT_CONFIG.REGISTER_NOTE,
		)
		expect(
			screen.queryByTestId(TEST_IDS.REGISTER.FORM),
		).not.toBeInTheDocument()
		expect(
			screen.getByRole('heading', {
				level: 1,
				name: 'Register as a traveller',
			}),
		).toBeInTheDocument()
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
			submit()
			await screen.findByTestId(TEST_IDS.REGISTER.REGISTERING_DIALOG)
		}

		it('shows the spinner while no upload has started', async () => {
			await submitWhilePending(null)

			expect(
				screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
			).toBeInTheDocument()
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
			expect(
				screen.queryByTestId(TEST_IDS.SPINNER.CONTAINER),
			).not.toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('registers, keeps the form busy while the upload is pending, and navigates with the saved alert once it resolves', async () => {
			let resolveUpload
			store.dispatch.mockReturnValue({
				unwrap: () =>
					new Promise((resolve) => {
						resolveUpload = resolve
					}),
			})

			renderRegister()
			submit()

			await screen.findByTestId(TEST_IDS.REGISTER.REGISTERING_DIALOG)
			expect(registerTraveller).toHaveBeenCalledWith({
				firstName: 'Test',
			})
			expect(getForm()).toHaveAttribute('data-loading', 'true')
			expect(mockNavigate).not.toHaveBeenCalled()

			resolveUpload({})

			await waitFor(() =>
				expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(
					PATHS.TRAVELLERS,
					{
						state: {
							alertMessage:
								TRAVELLER_REGISTRATION_SUCCESS_MESSAGE,
						},
					},
				),
			)
			expect(
				screen.queryByTestId(TEST_IDS.REGISTER.REGISTERING_DIALOG),
			).not.toBeInTheDocument()
			expect(getForm()).toHaveAttribute('data-loading', 'false')
		})

		it('shows the error, frees the form and closes the error when the upload fails part-way', async () => {
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
			submit()
			await screen.findByTestId(TEST_IDS.REGISTER.REGISTERING_DIALOG)
			expect(screen.getByRole('progressbar')).toBeInTheDocument()

			rejectUpload(errorMsg)

			expect(
				await screen.findByTestId(TEST_IDS.REGISTER.ERROR_DIALOG),
			).toHaveTextContent(errorMsg)
			expect(
				screen.queryByTestId(TEST_IDS.REGISTER.REGISTERING_DIALOG),
			).not.toBeInTheDocument()
			expect(getForm()).toHaveAttribute('data-loading', 'false')
			expect(mockNavigate).not.toHaveBeenCalled()

			fireEvent.click(screen.getByRole('button', { name: /close/i }))
			await waitFor(() =>
				expect(
					screen.queryByTestId(TEST_IDS.REGISTER.ERROR_DIALOG),
				).not.toBeInTheDocument(),
			)
		})
	})
})
