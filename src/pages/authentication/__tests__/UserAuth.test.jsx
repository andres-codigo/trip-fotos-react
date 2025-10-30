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

import { FIREBASE_ERRORS } from '@/constants/auth'

import { GLOBAL } from '@/constants/ui'
import {
	DIALOG,
	MOCK_KEYS,
	MOCK_LOGIN_PAYLOAD,
	MOCK_SIGNUP_ACTION,
	MOCK_INVALID_LOGIN_ERROR,
	MOCK_MESSAGES,
	TEST_IDS,
} from '@/constants/test'

import { PATHS } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

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
			FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
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

/**
 * Helper function to submit the login form
 */
const submitLoginForm = () => {
	fireEvent.click(
		screen.getByTestId(TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON),
	)
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
	secondReturn = FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
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

	describe('Rendering tests', () => {
		it('renders the <main> element', () => {
			renderWithProviders(<UserAuth />)

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies both mainContainer and authenticationContainer classes to <main>', () => {
			renderWithProviders(<UserAuth />)

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)

			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp('authenticationContainer'),
			)
		})

		it('<main> element has correct data attributes', () => {
			renderWithProviders(<UserAuth />)

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.USER_AUTH.CONTAINER,
			)
		})

		it('renders the UserAuthForm component', () => {
			renderWithProviders(<UserAuth />)

			const form = screen.getByTestId(TEST_IDS.USER_AUTH_FORM.FORM)
			expect(form).toBeInTheDocument()
		})
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

				renderWithProviders(<UserAuth />)

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

				renderWithProviders(<UserAuth />)

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
				renderWithProviders(<UserAuth />)

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

			it('dispatches signup action when component is in signup mode', async () => {
				renderWithProviders(<UserAuth />)

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
					expect(mockDispatch).toHaveBeenCalledWith(
						MOCK_SIGNUP_ACTION,
					)
				})
			})

			it('navigates to travellers page after successful authentication', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: {},
				})

				renderWithProviders(<UserAuth />)

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

				renderWithProviders(<UserAuth />)

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

				renderWithProviders(<UserAuth />)

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

			it('renders loading dialog with correct structure and properties', async () => {
				// Mock dispatch to never resolve for persistent loading state
				mockDispatch.mockImplementation(() => new Promise(() => {}))

				renderWithProviders(<UserAuth />)

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
					const loadingDialog = screen.getByTestId(
						TEST_IDS.DIALOG.AUTHENTICATING,
					)
					expect(loadingDialog).toBeInTheDocument()
					expect(loadingDialog).toHaveAttribute(
						'data-cy',
						TEST_IDS.DIALOG.AUTHENTICATING,
					)

					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_TITLE),
					).toBeInTheDocument()
					expect(
						screen.getByText(MOCK_MESSAGES.AUTHENTICATING_DETAILS),
					).toBeInTheDocument()
					expect(
						screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
					).toBeInTheDocument()
				})
			})
		})

		describe('Error handling', () => {
			it('displays error dialog when authentication fails)', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: MOCK_INVALID_LOGIN_ERROR,
				})

				renderWithProviders(<UserAuth />)
				fillAndSubmitLoginForm()

				await expectErrorDialog(
					FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)
			})

			it('closes error dialog when close button is clicked', async () => {
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

			it('displays fallback error message when Firebase error handler returns null', async () => {
				const getFirebaseAuthErrorMessage =
					await setupFirebaseErrorMock(
						null,
						FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
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
					FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)
			})

			it('handles and displays errors thrown during form submission', async () => {
				const testError = new Error('Test error message')
				mockDispatch.mockRejectedValueOnce(testError)

				renderWithProviders(<UserAuth />)
				fillAndSubmitLoginForm()

				await expectErrorDialog('Test error message')
			})

			it('displays fallback message when error object has no message', async () => {
				const { getFirebaseAuthErrorMessage } = await import(
					'@/utils/getFirebaseAuthErrorMessage'
				)

				getFirebaseAuthErrorMessage.mockReturnValue(
					FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				)

				const errorWithoutMessage = new Error()
				errorWithoutMessage.message = ''
				mockDispatch.mockRejectedValueOnce(errorWithoutMessage)

				renderWithProviders(<UserAuth />)

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
						screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
					).toBeInTheDocument()
					expect(
						screen.getByText(
							FIREBASE_ERRORS.AUTHENTICATION_ACTION_TYPES
								.INVALID_LOGIN_CREDENTIALS_MESSAGE,
						),
					).toBeInTheDocument()
				})
			})
		})
	})
})
