import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { ERROR_MESSAGES } from '@/constants/errors'
import { API_DATABASE } from '@/constants/api'
import { AUTH_FORM_CONFIG, PASSWORD_RESET_CONFIG } from '@/constants/auth'

import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'
import {
	DIALOG,
	MOCK_KEYS,
	MOCK_LOGIN_PAYLOAD,
	TEST_IDS,
} from '@/constants/test'

import { PATHS } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import { validateEmail, validatePassword } from '@/utils/validation'

import { login, sendPasswordReset } from '@/store/slices/authenticationSlice'

import Authentication from '@/pages/authentication/Authentication'

vi.mock('@/store/slices/authenticationSlice', () => {
	const sendPasswordReset = vi.fn((email) => ({ type: 'reset', email }))
	sendPasswordReset.rejected = {
		match: (result) => result?.meta?.rejectedWithValue === true,
	}
	return { login: vi.fn(() => Promise.resolve({})), sendPasswordReset }
})

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

			expect(document.title).toBe(`Log in · ${GLOBAL.SITE_NAME}`)
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

				const title = () =>
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.FORM_TITLE)
				expect(title()).toHaveTextContent(AUTH_FORM_CONFIG.LOGIN_TITLE)

				fireEvent.click(switchBtn)
				expect(title()).toHaveTextContent(AUTH_FORM_CONFIG.SIGNUP_TITLE)
				expect(title()).toHaveFocus()
				expect(document.title).toBe(
					`${AUTH_FORM_CONFIG.SIGNUP_TITLE} · ${GLOBAL.SITE_NAME}`,
				)

				fireEvent.click(switchBtn)
				expect(title()).toHaveTextContent(AUTH_FORM_CONFIG.LOGIN_TITLE)
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
			it('shows the busy button, not a dialog, while logging in, and clears it when done', async () => {
				let resolveAuth
				mockDispatch.mockReturnValueOnce(
					new Promise((resolve) => {
						resolveAuth = resolve
					}),
				)

				renderWithProviders(<Authentication />)
				fillLoginForm()
				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				const submit = screen.getByTestId(
					TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
				)
				await waitFor(() =>
					expect(submit).toHaveTextContent(
						AUTH_FORM_CONFIG.LOGIN_BUSY,
					),
				)
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

				resolveAuth({ meta: {} })
				await waitFor(() =>
					expect(submit).toHaveTextContent(
						AUTH_FORM_CONFIG.LOGIN_SUBMIT,
					),
				)
			})
		})

		describe('Validation timing and focus', () => {
			it('raises no error while typing, then flags the field when it is left', () => {
				validateEmail.mockReturnValueOnce({
					isValid: false,
					message: VALIDATION_MESSAGES.EMAIL_INVALID,
				})
				renderWithProviders(<Authentication />)
				const input = screen.getByTestId(
					TEST_IDS.USER_AUTH_FORM.EMAIL_INPUT,
				)

				fireEvent.change(input, { target: { value: 'amara@' } })
				expect(input).toHaveAttribute('aria-invalid', 'false')

				fireEvent.blur(input)
				expect(input).toHaveAttribute('aria-invalid', 'true')
			})

			it('moves focus to the first invalid field on a failed submit', () => {
				renderWithProviders(<Authentication />)
				fillLoginForm(MOCK_KEYS.EMAIL, '')

				fireEvent.click(
					screen.getByTestId(
						TEST_IDS.USER_AUTH_FORM.LOGIN_SUBMIT_BUTTON,
					),
				)

				expect(
					screen.getByTestId(TEST_IDS.USER_AUTH_FORM.PASSWORD_INPUT),
				).toHaveFocus()
				expect(login).not.toHaveBeenCalled()
			})
		})

		describe('Forgot password', () => {
			const openReset = () =>
				fireEvent.click(
					screen.getByRole('button', {
						name: AUTH_FORM_CONFIG.FORGOT_PASSWORD,
					}),
				)

			it('opens the reset view with the email carried over and its heading focused', () => {
				renderWithProviders(<Authentication />)
				fillLoginForm()
				openReset()

				const heading = screen.getByRole('heading', {
					name: PASSWORD_RESET_CONFIG.TITLE,
				})
				expect(heading).toHaveFocus()
				expect(document.title).toBe(
					`${PASSWORD_RESET_CONFIG.TITLE} · ${GLOBAL.SITE_NAME}`,
				)
				expect(
					screen.getByLabelText(/^Email/, { selector: 'input' }),
				).toHaveValue(MOCK_KEYS.EMAIL)
			})

			it('sends the reset and shows the same confirmation whatever the answer', async () => {
				mockDispatch.mockResolvedValueOnce({ meta: {} })
				renderWithProviders(<Authentication />)
				fillLoginForm()
				openReset()

				fireEvent.click(
					screen.getByRole('button', {
						name: PASSWORD_RESET_CONFIG.SUBMIT,
					}),
				)

				expect(sendPasswordReset).toHaveBeenCalledWith(MOCK_KEYS.EMAIL)
				expect(
					await screen.findByText(
						PASSWORD_RESET_CONFIG.SENT_MESSAGE(MOCK_KEYS.EMAIL),
					),
				).toBeInTheDocument()
			})

			it('keeps the form and says so when the link could not be sent', async () => {
				mockDispatch.mockResolvedValueOnce({
					meta: { rejectedWithValue: true },
					payload: ERROR_MESSAGES.PASSWORD_RESET_FAILED,
				})
				renderWithProviders(<Authentication />)
				fillLoginForm()
				openReset()

				fireEvent.click(
					screen.getByRole('button', {
						name: PASSWORD_RESET_CONFIG.SUBMIT,
					}),
				)

				expect(
					await screen.findByText(
						ERROR_MESSAGES.PASSWORD_RESET_FAILED,
					),
				).toBeInTheDocument()
				expect(
					screen.getByRole('button', {
						name: PASSWORD_RESET_CONFIG.SUBMIT,
					}),
				).toBeInTheDocument()
			})

			it('goes back to Log in with its heading focused', () => {
				renderWithProviders(<Authentication />)
				openReset()

				fireEvent.click(
					screen.getAllByRole('button', {
						name: PASSWORD_RESET_CONFIG.BACK,
					})[0],
				)

				expect(
					screen.getByRole('heading', {
						name: AUTH_FORM_CONFIG.LOGIN_TITLE,
					}),
				).toHaveFocus()
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
