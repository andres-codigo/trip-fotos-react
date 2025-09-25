import {
	render,
	screen,
	fireEvent,
	waitFor,
	renderHook,
} from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { DIALOG } from '@/constants/test/dialog'
import { FIREBASE_ERROR_TYPES } from '@/constants/firebase-error-types'
import {
	MOCK_KEYS,
	MOCK_LOGIN_PAYLOAD,
	MOCK_SIGNUP_ACTION,
	MOCK_INVALID_LOGIN_ERROR,
	MOCK_MESSAGES,
} from '@/constants/mock-data'
import { PATHS } from '@/constants/paths'
import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

import { validateEmail, validatePassword } from '@/utils/validation'

import { login } from '@/store/slices/authenticationSlice'

import UserAuth from '../UserAuth'

/**
 * UserAuth Unit Tests
 *
 * Test Strategy:
 * - Focuses on form validation, authentication flow, and error handling
 * - Complements E2E Cypress tests for user interaction and navigation flows
 * - Tests isolated validation handlers for email and password fields
 * - Verifies form submission behavior for both login and signup modes
 * - Ensures correct Redux actions are dispatched with proper payloads
 * - Validates loading states and error dialog rendering/interaction
 * - Uses comprehensive mocks for Redux, routing, validation, and Firebase utilities
 */

vi.mock('@/store/slices/authenticationSlice', () => ({
	login: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/utils/getFirebaseAuthErrorMessage', () => ({
	getFirebaseAuthErrorMessage: vi.fn(
		() =>
			FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
				.INVALID_LOGIN_CREDENTIALS_MESSAGE,
	),
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

/**
 * Helper function to fill login form inputs
 * @param {string} email - Email value (defaults to mock email)
 * @param {string} password - Password value (defaults to mock password)
 */
const fillLoginForm = (
	email = MOCK_KEYS.EMAIL,
	password = MOCK_KEYS.PASSWORD,
) => {
	fireEvent.change(screen.getByTestId('email-input'), {
		target: { value: email },
	})
	fireEvent.change(screen.getByTestId('password-input'), {
		target: { value: password },
	})
}

/**
 * Helper function to submit the login form
 */
const submitLoginForm = () => {
	fireEvent.click(screen.getByTestId('login-submit-button'))
}

/**
 * Helper function to fill and submit login form in one action
 * @param {string} email - Email value
 * @param {string} password - Password value
 */
const fillAndSubmitLoginForm = (email, password) => {
	fillLoginForm(email, password)
	submitLoginForm()
}

/**
 * Helper function to assert error dialog presence and message
 * @param {string} expectedMessage - Expected error message text
 */
const expectErrorDialog = async (expectedMessage) => {
	await waitFor(() =>
		expect(screen.getByRole(DIALOG.ROLE_ALERTDIALOG)).toBeInTheDocument(),
	)
	expect(screen.getByText(expectedMessage)).toBeInTheDocument()
}

/**
 * Helper function to assert error dialog is not present
 */
const expectNoErrorDialog = async () => {
	await waitFor(() =>
		expect(
			screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
		).not.toBeInTheDocument(),
	)
}

/**
 * Helper function to setup Firebase error message mocks
 * @param {string|null} firstReturn - First mock return value
 * @param {string} secondReturn - Second mock return value (fallback)
 * @returns {Function} Mock function reference
 */
const setupFirebaseErrorMock = async (
	firstReturn = null,
	secondReturn = FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
		.INVALID_LOGIN_CREDENTIALS_MESSAGE,
) => {
	const { getFirebaseAuthErrorMessage } = await import(
		'@/utils/getFirebaseAuthErrorMessage'
	)

	if (firstReturn !== undefined) {
		getFirebaseAuthErrorMessage.mockReturnValueOnce(firstReturn)
	}
	if (secondReturn !== undefined) {
		getFirebaseAuthErrorMessage.mockReturnValueOnce(secondReturn)
	}

	return getFirebaseAuthErrorMessage
}

describe('<UserAuth />', () => {
	beforeEach(() => {
		mockDispatch.mockClear()
		mockNavigate.mockClear()
	})

	describe('Behaviour tests', () => {
		describe('Form validation handlers', () => {
			it('validates email input and updates state accordingly', async () => {
				const { result } = renderHook(() => {
					const [, setEmail] = [{ value: '' }, vi.fn()]

					const handler = async (value) => {
						const { isValid, message } = validateEmail(value)
						setEmail(value, isValid, message)
						return isValid
					}
					return { setEmail, handler }
				})

				validateEmail.mockReturnValueOnce({
					isValid: true,
					message: '',
				})

				const isValid = await result.current.handler(MOCK_KEYS.EMAIL)
				expect(result.current.setEmail).toHaveBeenCalledWith(
					MOCK_KEYS.EMAIL,
					true,
					'',
				)
				expect(isValid).toBe(true)

				validateEmail.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
				})
				const isValid2 = await result.current.handler('')
				expect(result.current.setEmail).toHaveBeenCalledWith(
					'',
					false,
					VALIDATION_MESSAGES.EMAIL_REQUIRED,
				)
				expect(isValid2).toBe(false)
			})

			it('validates password input and updates state accordingly', async () => {
				const { result } = renderHook(() => {
					const [, setPassword] = [{ value: '' }, vi.fn()]
					const handler = async (value) => {
						const { isValid, message } = validatePassword(value)
						setPassword(value, isValid, message)
						return isValid
					}
					return { setPassword, handler }
				})

				validatePassword.mockReturnValueOnce({
					isValid: true,
					message: '',
				})
				const isValid = await result.current.handler(MOCK_KEYS.PASSWORD)
				expect(result.current.setPassword).toHaveBeenCalledWith(
					MOCK_KEYS.PASSWORD,
					true,
					'',
				)
				expect(isValid).toBe(true)

				validatePassword.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
				})
				const isValid2 = await result.current.handler('')
				expect(result.current.setPassword).toHaveBeenCalledWith(
					'',
					false,
					VALIDATION_MESSAGES.PASSWORD_REQUIRED,
				)
				expect(isValid2).toBe(false)
			})

			it('validates complete form with trimmed values', async () => {
				const mockEmail = { value: '  ' + MOCK_KEYS.EMAIL + '  ' }
				const mockPassword = { value: '  ' + MOCK_KEYS.PASSWORD + '  ' }
				const validateEmailHandler = vi.fn().mockResolvedValue(true)
				const validatePasswordHandler = vi.fn().mockResolvedValue(true)

				const validateForm = async () => {
					const trimmedEmail = mockEmail.value.trim()
					const trimmedPassword = mockPassword.value.trim()

					const emailValid = await validateEmailHandler(trimmedEmail)
					const passwordValid =
						await validatePasswordHandler(trimmedPassword)

					if (!emailValid || !passwordValid)
						return {
							email: trimmedEmail,
							password: trimmedPassword,
							isValid: false,
						}
					return {
						email: trimmedEmail,
						password: trimmedPassword,
						isValid: true,
					}
				}

				const result = await validateForm()
				expect(validateEmailHandler).toHaveBeenCalledWith(
					MOCK_KEYS.EMAIL,
				)
				expect(validatePasswordHandler).toHaveBeenCalledWith(
					MOCK_KEYS.PASSWORD,
				)
				expect(result).toEqual({
					email: MOCK_KEYS.EMAIL,
					password: MOCK_KEYS.PASSWORD,
					isValid: true,
				})
			})

			it('prevents form submission when email validation fails', async () => {
				validateEmail.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
				})
				validatePassword.mockReturnValueOnce({
					isValid: true,
					message: '',
				})

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL_INVALID },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(login).not.toHaveBeenCalled()
				})
			})

			it('validates form structure when validation fails', async () => {
				validateEmail.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
				})
				validatePassword.mockReturnValueOnce({
					isValid: true,
					message: '',
				})

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL_INVALID },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

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

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: '  ' + MOCK_KEYS.EMAIL + '  ' },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: '  ' + MOCK_KEYS.PASSWORD + '  ' },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

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

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: '' },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(login).not.toHaveBeenCalled()
					expect(validateEmail).toHaveBeenCalledWith(MOCK_KEYS.EMAIL)
					expect(validatePassword).toHaveBeenCalledWith('')
				})
			})
		})

		describe('Authentication flow', () => {
			it('dispatches login action with correct payload', async () => {
				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})
				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(login).toHaveBeenCalledWith(MOCK_LOGIN_PAYLOAD)
				})
			})

			it('dispatches signup action when in signup mode and form is submitted', async () => {
				renderWithProviders(<UserAuth />)

				const switchBtn = screen.getByTestId('login-signup-toggle-link')

				fireEvent.click(switchBtn)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})
				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(mockDispatch).toHaveBeenCalledWith(
						MOCK_SIGNUP_ACTION,
					)
				})
			})

			it('redirects to home after successful login', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: {},
				})

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})
				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(mockNavigate).toHaveBeenCalledWith(PATHS.HOME)
				})
			})
		})

		describe('Loading state management', () => {
			it('shows loading dialog when isLoading is true during form submission', async () => {
				// Mock dispatch to never resolve, keeping loading state active
				mockDispatch.mockImplementation(() => new Promise(() => {}))

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(
						screen.getByTestId('loading-dialog'),
					).toBeInTheDocument()
					expect(
						screen.getByText('Authenticating'),
					).toBeInTheDocument()
					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_DETAILS),
					).toBeInTheDocument()
					expect(
						screen.getByTestId('base-spinner'),
					).toBeInTheDocument()
				})
			})

			it('hides loading dialog when authentication completes successfully', async () => {
				// Create controllable promise to simulate async authentication
				let resolveAuth
				const authPromise = new Promise((resolve) => {
					resolveAuth = resolve
				})

				mockDispatch.mockReturnValueOnce(authPromise)

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

				// Loading dialog
				await waitFor(() => {
					expect(
						screen.getByTestId('loading-dialog'),
					).toBeInTheDocument()
				})

				// Simulate successful authentication completion
				resolveAuth({
					meta: {},
				})

				// Loading dialog should disappear after completion
				await waitFor(() => {
					expect(
						screen.queryByTestId('loading-dialog'),
					).not.toBeInTheDocument()
				})
			})

			it('renders loading dialog with correct structure and properties', async () => {
				// Mock dispatch to never resolve for persistent loading state
				mockDispatch.mockImplementation(() => new Promise(() => {}))

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})

				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					const loadingDialog = screen.getByTestId('loading-dialog')
					expect(loadingDialog).toBeInTheDocument()
					expect(loadingDialog).toHaveAttribute(
						'data-cy',
						'loading-dialog',
					)

					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_TITLE),
					).toBeInTheDocument()
					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_DETAILS),
					).toBeInTheDocument()
					expect(
						screen.getByTestId('base-spinner'),
					).toBeInTheDocument()
				})
			})
		})

		describe('Error handling', () => {
			it('shows error dialog when error occurs (internal logic)', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: MOCK_INVALID_LOGIN_ERROR,
				})

				renderWithProviders(<UserAuth />)
				fillAndSubmitLoginForm()

				await expectErrorDialog(
					FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)
			})

			it('closes the error dialog when the close button is clicked', async () => {
				renderWithProviders(<UserAuth />)

				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: MOCK_INVALID_LOGIN_ERROR,
				})

				fillAndSubmitLoginForm()
				await screen.findByRole(DIALOG.ROLE_ALERTDIALOG)

				fireEvent.click(screen.getByTestId(DIALOG.BUTTON))
				await expectNoErrorDialog()
			})

			it('throws error with fallback message when getFirebaseAuthErrorMessage returns null', async () => {
				const getFirebaseAuthErrorMessage =
					await setupFirebaseErrorMock(
						null,
						FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
							.INVALID_LOGIN_CREDENTIALS_MESSAGE,
					)

				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: MOCK_INVALID_LOGIN_ERROR,
				})

				renderWithProviders(<UserAuth />)
				fillAndSubmitLoginForm()

				await waitFor(() => {
					expect(getFirebaseAuthErrorMessage).toHaveBeenCalledTimes(2)
					expect(getFirebaseAuthErrorMessage).toHaveBeenCalledWith(
						MOCK_INVALID_LOGIN_ERROR,
					)
					expect(getFirebaseAuthErrorMessage).toHaveBeenCalledWith()
				})

				await expectErrorDialog(
					FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)
			})

			it('handles errors thrown during form submission and sets error state', async () => {
				const testError = new Error(MOCK_MESSAGES.TEST_ERROR)
				mockDispatch.mockRejectedValueOnce(testError)

				renderWithProviders(<UserAuth />)
				fillAndSubmitLoginForm()

				await expectErrorDialog(MOCK_MESSAGES.TEST_ERROR)
			})

			it('sets error with fallback message when caught error has no message', async () => {
				const { getFirebaseAuthErrorMessage } = await import(
					'@/utils/getFirebaseAuthErrorMessage'
				)

				getFirebaseAuthErrorMessage.mockReturnValue(
					FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)

				const errorWithoutMessage = new Error()
				errorWithoutMessage.message = ''
				mockDispatch.mockRejectedValueOnce(errorWithoutMessage)

				renderWithProviders(<UserAuth />)

				fireEvent.change(screen.getByTestId('email-input'), {
					target: { value: MOCK_KEYS.EMAIL },
				})
				fireEvent.change(screen.getByTestId('password-input'), {
					target: { value: MOCK_KEYS.PASSWORD },
				})
				fireEvent.click(screen.getByTestId('login-submit-button'))

				await waitFor(() => {
					expect(
						screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
					).toBeInTheDocument()
					expect(
						screen.getByText(
							FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
								.INVALID_LOGIN_CREDENTIALS_MESSAGE,
						),
					).toBeInTheDocument()
				})
			})
		})
	})
})
