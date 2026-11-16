import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import {
	ACCOUNT_SETTINGS_CONFIG,
	CHANGE_PASSWORD_CONFIG,
	VERIFIED_CHIP_CONFIG,
	VERIFY_EMAIL_PROMPT_CONFIG,
} from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import Account from '@/pages/account/Account'

const thunks = vi.hoisted(() => ({
	changePassword: vi.fn(),
	resend: vi.fn(),
}))

// The real thunks call Firebase; these keep the real action shapes so the page's fulfilled/rejected checks run as in the app
vi.mock('@/store/slices/authenticationSlice', async (importOriginal) => {
	const actual = await importOriginal()
	const { createAsyncThunk } = await import('@reduxjs/toolkit')
	const settle =
		(fn) =>
		async (arg, { rejectWithValue }) => {
			const outcome = await fn(arg)
			return outcome?.rejected ? rejectWithValue(outcome.reason) : outcome
		}
	return {
		...actual,
		changePassword: createAsyncThunk(
			'test/changePassword',
			settle(thunks.changePassword),
		),
		resendVerification: createAsyncThunk(
			'test/resendVerification',
			settle(thunks.resend),
		),
	}
})

const EMAIL = 'ada@example.com'
const CURRENT = 'old-secret'
const NEW = 'new-secret'

const renderPage = ({ emailVerified = true } = {}) => {
	const reducer = {
		authentication: authenticationReducer,
		travellers: travellersReducer,
	}
	const initial = configureTestStore({ reducer }).getState()
	const store = configureTestStore({
		reducer,
		preloadedState: {
			authentication: {
				...initial.authentication,
				userId: 'ada-uid',
				userEmail: EMAIL,
				emailVerified,
			},
		},
	})
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[PATHS.ACCOUNT]}>
				<Account />
			</MemoryRouter>
		</Provider>,
	)
}

const changePasswordButton = () =>
	screen.getByRole('button', {
		name: ACCOUNT_SETTINGS_CONFIG.CHANGE_PASSWORD,
	})

const field = (label) => screen.getByLabelText(new RegExp(`^${label}`))

const fillAndSave = () => {
	fireEvent.change(field(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL), {
		target: { value: CURRENT },
	})
	fireEvent.change(field(CHANGE_PASSWORD_CONFIG.NEW_PASSWORD_LABEL), {
		target: { value: NEW },
	})
	fireEvent.click(
		screen.getByRole('button', {
			name: CHANGE_PASSWORD_CONFIG.SAVE_PASSWORD,
		}),
	)
}

describe('Account', () => {
	beforeEach(() => {
		thunks.changePassword.mockReset()
		thunks.resend.mockReset()
	})

	describe('Rendering tests', () => {
		it('renders the Account settings heading inside the skip link target', () => {
			renderPage()

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(
				screen.getByRole('heading', {
					level: 1,
					name: ACCOUNT_SETTINGS_CONFIG.TITLE,
				}),
			).toBeInTheDocument()
			expect(document.title).toBe(
				`${ACCOUNT_SETTINGS_CONFIG.PAGE_TITLE} · ${GLOBAL.SITE_NAME}`,
			)
		})

		it('shows a verified email without the send link', () => {
			renderPage()

			expect(screen.getByText(EMAIL)).toBeInTheDocument()
			expect(
				screen.getByText(VERIFIED_CHIP_CONFIG.VERIFIED),
			).toBeInTheDocument()
			expect(
				screen.queryByRole('button', {
					name: VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN,
				}),
			).not.toBeInTheDocument()
		})

		it('shows an unverified email with Send the link again', () => {
			renderPage({ emailVerified: false })

			expect(
				screen.getByText(VERIFIED_CHIP_CONFIG.NOT_VERIFIED),
			).toBeInTheDocument()
			expect(
				screen.getByText(ACCOUNT_SETTINGS_CONFIG.VERIFY_TEXT),
			).toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		it('sends the link again and says where it went', async () => {
			thunks.resend.mockResolvedValueOnce(EMAIL)
			renderPage({ emailVerified: false })

			fireEvent.click(
				screen.getByRole('button', {
					name: VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN,
				}),
			)

			expect(await screen.findByRole('status')).toHaveTextContent(
				VERIFY_EMAIL_PROMPT_CONFIG.SENT_TO(EMAIL),
			)
		})

		it('says when the link could not be sent', async () => {
			thunks.resend.mockResolvedValueOnce({
				rejected: true,
				reason: ERROR_MESSAGES.VERIFICATION_EMAIL_FAILED,
			})
			renderPage({ emailVerified: false })

			fireEvent.click(
				screen.getByRole('button', {
					name: VERIFY_EMAIL_PROMPT_CONFIG.SEND_AGAIN,
				}),
			)

			expect(
				await screen.findByText(VERIFY_EMAIL_PROMPT_CONFIG.NOT_SENT),
			).toBeInTheDocument()
		})

		it('opens the form in place with focus in Current password, and Cancel returns focus', async () => {
			renderPage()

			fireEvent.click(changePasswordButton())
			await waitFor(() =>
				expect(
					field(CHANGE_PASSWORD_CONFIG.CURRENT_PASSWORD_LABEL),
				).toHaveFocus(),
			)

			fireEvent.click(
				screen.getByRole('button', {
					name: CHANGE_PASSWORD_CONFIG.CANCEL,
				}),
			)
			await waitFor(() => expect(changePasswordButton()).toHaveFocus())
			expect(screen.queryByRole('form')).not.toBeInTheDocument()
		})

		it('changes the password, closes the form and announces it', async () => {
			thunks.changePassword.mockResolvedValueOnce(undefined)
			renderPage()

			fireEvent.click(changePasswordButton())
			fillAndSave()

			expect(await screen.findByRole('status')).toHaveTextContent(
				ACCOUNT_SETTINGS_CONFIG.PASSWORD_CHANGED,
			)
			expect(thunks.changePassword).toHaveBeenCalledWith({
				currentPassword: CURRENT,
				newPassword: NEW,
			})
			await waitFor(() => expect(changePasswordButton()).toHaveFocus())
		})

		it('keeps the form open on a wrong current password', async () => {
			thunks.changePassword.mockResolvedValueOnce({
				rejected: true,
				reason: ERROR_MESSAGES.WRONG_CURRENT_PASSWORD,
			})
			renderPage()

			fireEvent.click(changePasswordButton())
			fillAndSave()

			expect(
				await screen.findByText(ERROR_MESSAGES.WRONG_CURRENT_PASSWORD),
			).toBeInTheDocument()
			expect(screen.queryByRole('status')).not.toBeInTheDocument()
		})
	})
})
