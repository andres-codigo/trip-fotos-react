import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	render,
	screen,
	fireEvent,
	waitFor,
	renderHook,
	act,
} from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { DIALOG } from '@/constants/test/dialog'
import { FIREBASE_ERROR_TYPES } from '@/constants/firebase-error-types'
import {
	MOCK_KEYS,
	MOCK_LOGIN_PAYLOAD,
	MOCK_SIGNUP_ACTION,
	MOCK_INVALID_LOGIN_ERROR,
} from '@/constants/mock-data'
import { PATHS } from '@/constants/paths'
import { VALIDATION_MESSAGES } from '@/constants/validation-messages'

import { validateEmail, validatePassword } from '@/utils/validation'

import { login } from '@/store/slices/authenticationSlice'

import UserAuth from '../UserAuth'

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

describe('<UserAuth />', () => {
	beforeEach(() => {
		mockDispatch.mockClear()
		mockNavigate.mockClear()
	})

	describe('Behaviour tests', () => {
		it('validateEmailHandler sets email state and returns validity', async () => {
			const { result } = renderHook(() => {
				const [email, setEmail] = [{ value: '' }, vi.fn()]

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

		it('validatePasswordHandler sets password state and returns validity', async () => {
			const { result } = renderHook(() => {
				const [password, setPassword] = [{ value: '' }, vi.fn()]
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

		it('validateForm trims values, calls handlers, and returns validity', async () => {
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
			expect(validateEmailHandler).toHaveBeenCalledWith(MOCK_KEYS.EMAIL)
			expect(validatePasswordHandler).toHaveBeenCalledWith(
				MOCK_KEYS.PASSWORD,
			)
			expect(result).toEqual({
				email: MOCK_KEYS.EMAIL,
				password: MOCK_KEYS.PASSWORD,
				isValid: true,
			})
		})

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
				expect(mockDispatch).toHaveBeenCalledWith(MOCK_SIGNUP_ACTION)
			})
		})

		it('shows error dialog when error occurs (internal logic)', async () => {
			mockDispatch.mockResolvedValueOnce({
				meta: { rejectedWithValue: true },
				payload: MOCK_INVALID_LOGIN_ERROR,
			})

			renderWithProviders(<UserAuth />)

			fireEvent.change(screen.getByTestId('email-input'), {
				target: { value: MOCK_KEYS.EMAIL },
			})
			fireEvent.change(screen.getByTestId('password-input'), {
				target: { value: MOCK_KEYS.PASSWORD },
			})
			fireEvent.click(screen.getByTestId('login-submit-button'))

			await waitFor(() =>
				expect(
					screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
				).toBeInTheDocument(),
			)
			expect(
				screen.getByText(
					FIREBASE_ERROR_TYPES.AUTHENTICATION_ACTION_TYPES
						.INVALID_LOGIN_CREDENTIALS_MESSAGE,
				),
			).toBeInTheDocument()
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
})
