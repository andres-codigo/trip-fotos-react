import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
