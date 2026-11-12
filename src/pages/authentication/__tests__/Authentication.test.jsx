import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { API_DATABASE } from '@/constants/api'

import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'
import {
	DIALOG,
	MOCK_KEYS,
	MOCK_LOGIN_PAYLOAD,
	MOCK_MESSAGES,
	TEST_IDS,
} from '@/constants/test'

import { PATHS } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import { validateEmail, validatePassword } from '@/utils/validation'

import { login } from '@/store/slices/authenticationSlice'

import Authentication from '@/pages/authentication/Authentication'

vi.mock('@/store/slices/authenticationSlice', () => ({
	login: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/utils/validation', () => ({
	validateEmail: vi.fn((v) => ({
		isValid: !!v,
		message: v ? '' : VALIDATION_MESSAGES.EMAIL_REQUIRED,
	})),
	validatePassword: vi.fn((v) => ({
		isValid: !!v,
		message: v ? '' : VALIDATION_MESSAGES.PASSWORD_REQUIRED,
	})),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual('react-router-dom')
	return {
		...actual,
		useNavigate: () => mockNavigate,
	}
})

const mockDispatch = vi.fn(() => Promise.resolve({}))
const mockStore = {
	getState: () => ({}),
	subscribe: () => () => {},
	dispatch: mockDispatch,
}

const renderWithProviders = (ui) =>
	render(
		<Provider store={mockStore}>
			<BrowserRouter>{ui}</BrowserRouter>
		</Provider>,
	)

const fillLoginForm = (
	email = MOCK_KEYS.EMAIL,
	password = MOCK_KEYS.PASSWORD,
) => {
	fireEvent.change(screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT), {
		target: { value: email },
	})
	fireEvent.change(
		screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
		{
			target: { value: password },
		},
	)
}

const submitLoginForm = () => {
	fireEvent.click(
		screen.getByTestId(TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON),
	)
}

const fillAndSubmitLoginForm = (email, password) => {
	fillLoginForm(email, password)
	submitLoginForm()
}

const expectErrorDialog = async (expectedMessage) => {
	await waitFor(() =>
		expect(screen.getByRole(DIALOG.ROLE_ALERTDIALOG)).toBeInTheDocument(),
	)
	expect(screen.getByText(expectedMessage)).toBeInTheDocument()
}

const expectNoErrorDialog = async () => {
	await waitFor(() =>
		expect(
			screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
		).not.toBeInTheDocument(),
	)
}

describe('<Authentication />', () => {
	beforeEach(() => {
		mockDispatch.mockClear()
		mockNavigate.mockClear()
	})

	describe('Rendering tests', () => {
		it('renders the form inside <main>, the skip link target', () => {
			renderWithProviders(<Authentication />)

			const main = screen.getByRole('main')

			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.USER_AUTH.CONTAINER,
			)
			expect(
				screen.getByTestId(TEST_IDS.USER_AUTH_FORM.FORM),
			).toBeInTheDocument()
		})

		it('sets the document title', () => {
			renderWithProviders(<Authentication />)

			expect(document.title).toBe(`Login · ${GLOBAL.SITE_NAME}`)
		})
	})

	describe('Behaviour tests', () => {
		describe('Form validation handlers', () => {
			it('prevents form submission when email validation fails', async () => {
				validateEmail.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
				})
				validatePassword.mockReturnValueOnce({
					isValid: true,
					message: '',
				})

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL_INVALID },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(login).not.toHaveBeenCalled()

					expect(validateEmail).toHaveBeenCalledWith(
						MOCK_KEYS.EMAIL_INVALID,
					)
					expect(validatePassword).toHaveBeenCalledWith(
						MOCK_KEYS.PASSWORD,
					)
				})
			})

			it('trims whitespace from inputs before validation', async () => {
				validateEmail.mockReturnValueOnce({
					isValid: true,
					message: '',
				})
				validatePassword.mockReturnValueOnce({
					isValid: true,
					message: '',
				})

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: '  ' + MOCK_KEYS.EMAIL + '  ' },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: '  ' + MOCK_KEYS.PASSWORD + '  ' },
					},
				)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(validateEmail).toHaveBeenCalledWith(MOCK_KEYS.EMAIL)
					expect(validatePassword).toHaveBeenCalledWith(
						MOCK_KEYS.PASSWORD,
					)
				})
			})

			it('prevents form submission when password validation fails', async () => {
				validateEmail.mockReturnValueOnce({
					isValid: true,
					message: '',
				})
				validatePassword.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
				})

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: '' },
					},
				)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(login).not.toHaveBeenCalled()
					expect(validateEmail).toHaveBeenCalledWith(MOCK_KEYS.EMAIL)
					expect(validatePassword).toHaveBeenCalledWith('')
				})
			})
		})

		describe('Authentication flow', () => {
			it('dispatches login action with correct payload on form submission', async () => {
				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)
				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(login).toHaveBeenCalledWith(MOCK_LOGIN_PAYLOAD)
				})
			})

			it('toggles between login and signup modes when switch button is clicked', async () => {
				renderWithProviders(<Authentication />)

				const switchBtn = screen.getByTestId(
					TEST_IDS.USER_AUTH_FORM.LOGIN_SIGNUP_TOGGLE_LINK,
				)

				expect(screen.getByText(/log in/i)).toBeInTheDocument()

				fireEvent.click(switchBtn)
				expect(screen.getByText(/sign up/i)).toBeInTheDocument()
				expect(document.title).toBe(`Signup · ${GLOBAL.SITE_NAME}`)

				fireEvent.click(switchBtn)
				expect(screen.getByText(/log in/i)).toBeInTheDocument()
			})

			it('dispatches login thunk with signup mode when component is in signup mode', async () => {
				renderWithProviders(<Authentication />)

				const switchBtn = screen.getByTestId(
					TEST_IDS.USER_AUTH_FORM.LOGIN_SIGNUP_TOGGLE_LINK,
				)

				fireEvent.click(switchBtn)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)
				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(login).toHaveBeenCalledWith({
						mode: API_DATABASE.AUTH_SIGNUP_MODE,
						email: MOCK_KEYS.EMAIL,
						password: MOCK_KEYS.PASSWORD,
					})
				})
			})

			it('navigates to travellers page after successful authentication', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: {},
				})

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)
				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(mockNavigate).toHaveBeenCalledWith(PATHS.TRAVELLERS)
				})
			})
		})

		describe('Loading state management', () => {
			it('displays loading dialog during authentication process', async () => {
				// Mock dispatch to never resolve, keeping loading state active
				mockDispatch.mockImplementation(() => new Promise(() => {}))

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				await waitFor(() => {
					expect(
						screen.getByTestId(TEST_IDS.DIALOG.AUTHENTICATING),
					).toBeInTheDocument()
					expect(
						screen.getByText('Authenticating'),
					).toBeInTheDocument()
					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_DETAILS),
					).toBeInTheDocument()
					expect(
						screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
					).toBeInTheDocument()
				})
			})

			it('hides loading dialog when authentication completes', async () => {
				// Create controllable promise to simulate async authentication
				let resolveAuth
				const authPromise = new Promise((resolve) => {
					resolveAuth = resolve
				})

				mockDispatch.mockReturnValueOnce(authPromise)

				renderWithProviders(<Authentication />)

				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT),
					{
						target: { value: MOCK_KEYS.EMAIL },
					},
				)
				fireEvent.change(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
					{
						target: { value: MOCK_KEYS.PASSWORD },
					},
				)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				// Loading dialog
				await waitFor(() => {
					expect(
						screen.getByTestId(TEST_IDS.DIALOG.AUTHENTICATING),
					).toBeInTheDocument()
				})

				// Simulate successful authentication completion
				resolveAuth({
					meta: {},
				})

				// Loading dialog should disappear after completion
				await waitFor(() => {
					expect(
						screen.queryByTestId(TEST_IDS.DIALOG.AUTHENTICATING),
					).not.toBeInTheDocument()
				})
			})
		})

		describe('Error handling', () => {
			it('displays the message from a rejected login', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
				})

				renderWithProviders(<Authentication />)
				fillAndSubmitLoginForm()

				await expectErrorDialog(
					ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
				)
			})

			it('displays email already in use error dialog when signup fails', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: ERROR_MESSAGES.EMAIL_ALREADY_IN_USE,
				})

				renderWithProviders(<Authentication />)

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SIGNUP_TOGGLE_LINK,
					),
				)
				fillAndSubmitLoginForm()

				await expectErrorDialog(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE)
			})

			it('closes error dialog when close button is clicked', async () => {
				renderWithProviders(<Authentication />)

				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
				})

				fillAndSubmitLoginForm()
				await screen.findByRole(DIALOG.ROLE_ALERTDIALOG)

				fireEvent.click(screen.getByTestId(DIALOG.BUTTON))
				await expectNoErrorDialog()
			})

			it('handles and displays errors thrown during form submission', async () => {
				const testError = new Error('Test error message')
				mockDispatch.mockRejectedValueOnce(testError)

				renderWithProviders(<Authentication />)
				fillAndSubmitLoginForm()

				await expectErrorDialog('Test error message')
			})

			it('displays the sign-in fallback when the error has no message', async () => {
				const errorWithoutMessage = new Error()
				errorWithoutMessage.message = ''
				mockDispatch.mockRejectedValueOnce(errorWithoutMessage)

				renderWithProviders(<Authentication />)
				fillAndSubmitLoginForm()

				await expectErrorDialog(ERROR_MESSAGES.LOGIN_FAILED)
			})
		})
	})
})
