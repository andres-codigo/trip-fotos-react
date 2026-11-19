import { StrictMode } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'

import { ACTION_CODE_ERRORS, AUTH_ACTION_CONFIG } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

import AuthAction from '@/pages/auth-action/AuthAction'

const thunks = vi.hoisted(() => ({
	apply: vi.fn(),
	applyChange: vi.fn(),
	check: vi.fn(),
	confirm: vi.fn(),
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
		applyEmailVerification: createAsyncThunk(
			'test/applyEmailVerification',
			settle(thunks.apply),
		),
		applyEmailChange: createAsyncThunk(
			'test/applyEmailChange',
			settle(thunks.applyChange),
		),
		checkPasswordResetCode: createAsyncThunk(
			'test/checkPasswordResetCode',
			settle(thunks.check),
		),
		confirmPasswordReset: createAsyncThunk(
			'test/confirmPasswordReset',
			settle(thunks.confirm),
		),
		resendVerification: createAsyncThunk(
			'test/resendVerification',
			settle(thunks.resend),
		),
	}
})

const CODE = 'one-time-code'
const EMAIL = 'ada@example.com'
const PASSWORD = 'secret-password'
const USER_ID = 'ada-uid'

const reject = (reason) => ({ rejected: true, reason })

const createStore = ({ signedIn = false, isTraveller = null } = {}) => {
	const reducer = {
		authentication: authenticationReducer,
		travellers: travellersReducer,
	}
	const initial = configureTestStore({ reducer }).getState()
	return configureTestStore({
		reducer,
		preloadedState: {
			authentication: {
				...initial.authentication,
				...(signedIn && {
					token: 'token',
					userId: USER_ID,
					userName: 'Ada Lovelace',
					userEmail: EMAIL,
				}),
			},
			travellers: {
				...initial.travellers,
				...(isTraveller !== null && {
					isTraveller,
					isTravellerCheckedFor: USER_ID,
				}),
			},
		},
	})
}

const renderPage = ({ search, strict = false, ...state } = {}) => {
	const page = (
		<Provider store={createStore(state)}>
			<MemoryRouter initialEntries={[`${PATHS.AUTH_ACTION}${search}`]}>
				<AuthAction />
			</MemoryRouter>
		</Provider>
	)
	return render(strict ? <StrictMode>{page}</StrictMode> : page)
}

const verifyLink = `?mode=verifyEmail&oobCode=${CODE}`
const resetLink = `?mode=resetPassword&oobCode=${CODE}`
const changeLink = `?mode=verifyAndChangeEmail&oobCode=${CODE}`
const recoverLink = `?mode=recoverEmail&oobCode=${CODE}`
const NEW_EMAIL = 'ada.new@example.org'
const VERIFIED_SIGNED_OUT = { signedIn: false, alreadyVerified: false }

const findHeading = (name) => screen.findByRole('heading', { level: 1, name })
const getLink = (name) => screen.getByRole('link', { name })
const getPassword = () =>
	screen.getByLabelText(
		new RegExp(`^${AUTH_ACTION_CONFIG.NEW_PASSWORD_LABEL}`),
	)

const submitPassword = (value = PASSWORD) => {
	fireEvent.change(getPassword(), { target: { value } })
	fireEvent.click(
		screen.getByRole('button', { name: AUTH_ACTION_CONFIG.SAVE_PASSWORD }),
	)
}

describe('<AuthAction />', () => {
	beforeEach(() => {
		Object.values(thunks).forEach((fn) => fn.mockReset())
	})

	it('renders the skip-link target with its own title', async () => {
		thunks.apply.mockResolvedValue(VERIFIED_SIGNED_OUT)
		renderPage({ search: verifyLink })

		const main = screen.getByRole('main')
		expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
		expect(main).toHaveAttribute('tabindex', '-1')
		await findHeading(AUTH_ACTION_CONFIG.VERIFIED_TITLE)
		expect(document.title).toBe(
			`${AUTH_ACTION_CONFIG.VERIFIED_TITLE} · ${GLOBAL.SITE_NAME}`,
		)
	})

	describe.each([
		[
			'verifyEmail',
			verifyLink,
			'apply',
			VERIFIED_SIGNED_OUT,
			AUTH_ACTION_CONFIG.VERIFIED_TITLE,
		],
		[
			'resetPassword',
			resetLink,
			'check',
			EMAIL,
			AUTH_ACTION_CONFIG.RESET_TITLE,
		],
	])('%s link check', (_, search, thunk, result, title) => {
		it('shows a busy spinner while the link is checked', () => {
			thunks[thunk].mockReturnValue(new Promise(() => {}))
			renderPage({ search })

			const spinner = screen.getByRole('status')
			expect(spinner).toHaveTextContent(AUTH_ACTION_CONFIG.LOADING)
			expect(spinner).toHaveAttribute('aria-busy', 'true')
		})

		it('shows the network alert and checks the link again on Try again', async () => {
			thunks[thunk]
				.mockResolvedValueOnce(reject(ACTION_CODE_ERRORS.NETWORK))
				.mockResolvedValueOnce(result)
			renderPage({ search })

			await findHeading(AUTH_ACTION_CONFIG.NETWORK_TITLE)
			expect(screen.getByRole('alert')).toHaveTextContent(
				AUTH_ACTION_CONFIG.NETWORK_TEXT,
			)

			fireEvent.click(
				screen.getByRole('button', {
					name: AUTH_ACTION_CONFIG.TRY_AGAIN,
				}),
			)
			await findHeading(title)
			expect(thunks[thunk]).toHaveBeenCalledTimes(2)
		})
	})

	describe('Invalid links', () => {
		it.each([
			['no code', '?mode=verifyEmail'],
			['no mode', `?oobCode=${CODE}`],
			['an unknown mode', `?mode=signIn&oobCode=${CODE}`],
		])(
			'shows the invalid card for %s without calling Firebase',
			(_, search) => {
				renderPage({ search })

				expect(
					screen.getByRole('heading', {
						level: 1,
						name: AUTH_ACTION_CONFIG.INVALID_TITLE,
					}),
				).toBeInTheDocument()
				expect(
					screen.getByText(AUTH_ACTION_CONFIG.INVALID_TEXT),
				).toBeInTheDocument()
				expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toHaveAttribute(
					'href',
					PATHS.AUTHENTICATION,
				)
				expect(thunks.apply).not.toHaveBeenCalled()
				expect(thunks.check).not.toHaveBeenCalled()
			},
		)
	})

	describe('verifyEmail', () => {
		it('applies the code once under StrictMode', async () => {
			thunks.apply.mockResolvedValue(VERIFIED_SIGNED_OUT)
			renderPage({ search: verifyLink, strict: true })

			await findHeading(AUTH_ACTION_CONFIG.VERIFIED_TITLE)
			expect(thunks.apply).toHaveBeenCalledTimes(1)
			expect(thunks.apply).toHaveBeenCalledWith(CODE)
		})

		it.each([
			['a signed-in non-traveller', false],
			[
				'a signed-in user whose traveller check has not come back',
				undefined,
			],
		])(
			'thanks %s by first name, offers Register and focuses the heading',
			async (_, isTraveller) => {
				thunks.apply.mockResolvedValue({
					signedIn: true,
					alreadyVerified: false,
				})
				renderPage({ search: verifyLink, signedIn: true, isTraveller })

				const heading = await findHeading(
					AUTH_ACTION_CONFIG.VERIFIED_TITLE,
				)
				await waitFor(() => expect(heading).toHaveFocus())
				expect(
					screen.getByText(AUTH_ACTION_CONFIG.VERIFIED_TEXT('Ada')),
				).toBeInTheDocument()
				expect(getLink(AUTH_ACTION_CONFIG.REGISTER)).toHaveAttribute(
					'href',
					PATHS.REGISTER,
				)
			},
		)

		it('sends a signed-in traveller to Travellers', async () => {
			thunks.apply.mockResolvedValue({
				signedIn: true,
				alreadyVerified: false,
			})
			renderPage({
				search: verifyLink,
				signedIn: true,
				isTraveller: true,
			})

			await findHeading(AUTH_ACTION_CONFIG.VERIFIED_TITLE)
			expect(
				screen.getByText(
					AUTH_ACTION_CONFIG.VERIFIED_TRAVELLER_TEXT('Ada'),
				),
			).toBeInTheDocument()
			expect(
				getLink(AUTH_ACTION_CONFIG.GO_TO_TRAVELLERS),
			).toHaveAttribute('href', PATHS.TRAVELLERS)
		})

		it('asks a signed-out user to log in', async () => {
			thunks.apply.mockResolvedValue(VERIFIED_SIGNED_OUT)
			renderPage({ search: verifyLink })

			await findHeading(AUTH_ACTION_CONFIG.VERIFIED_TITLE)
			expect(
				screen.getByText(AUTH_ACTION_CONFIG.VERIFIED_SIGNED_OUT_TEXT),
			).toBeInTheDocument()
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toHaveAttribute(
				'href',
				PATHS.AUTHENTICATION,
			)
		})

		it('says an already verified email needs nothing more', async () => {
			thunks.apply.mockResolvedValue({
				signedIn: true,
				alreadyVerified: true,
			})
			renderPage({ search: verifyLink, signedIn: true })

			await findHeading(AUTH_ACTION_CONFIG.ALREADY_TITLE)
			expect(
				screen.getByText(AUTH_ACTION_CONFIG.ALREADY_TEXT),
			).toBeInTheDocument()
			expect(
				getLink(AUTH_ACTION_CONFIG.GO_TO_TRAVELLERS),
			).toBeInTheDocument()
			expect(document.querySelector('svg')).toBeNull()
		})

		it('shows the invalid card for an invalid code', async () => {
			thunks.apply.mockResolvedValue(reject(ACTION_CODE_ERRORS.INVALID))
			renderPage({ search: verifyLink })

			await findHeading(AUTH_ACTION_CONFIG.INVALID_TITLE)
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toBeInTheDocument()
		})

		it('asks a signed-out user with an expired link to log in', async () => {
			thunks.apply.mockResolvedValue(reject(ACTION_CODE_ERRORS.EXPIRED))
			renderPage({ search: verifyLink })

			await findHeading(AUTH_ACTION_CONFIG.EXPIRED_TITLE)
			expect(
				screen.getByText(AUTH_ACTION_CONFIG.EXPIRED_SIGNED_OUT_TEXT),
			).toBeInTheDocument()
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toBeInTheDocument()
			expect(
				screen.queryByRole('button', {
					name: AUTH_ACTION_CONFIG.SEND_NEW_LINK,
				}),
			).not.toBeInTheDocument()
		})

		describe('Expired link, signed in', () => {
			const renderExpired = async () => {
				thunks.apply.mockResolvedValue(
					reject(ACTION_CODE_ERRORS.EXPIRED),
				)
				renderPage({ search: verifyLink, signedIn: true })
				await findHeading(AUTH_ACTION_CONFIG.EXPIRED_TITLE)
			}

			const getSend = () =>
				screen.getByRole('button', {
					name: AUTH_ACTION_CONFIG.SEND_NEW_LINK,
				})

			it('offers a new link, busy while it sends, then shows where it went', async () => {
				let finish
				thunks.resend.mockReturnValue(
					new Promise((resolve) => {
						finish = resolve
					}),
				)
				await renderExpired()
				expect(
					screen.getByText(AUTH_ACTION_CONFIG.EXPIRED_TEXT),
				).toBeInTheDocument()

				fireEvent.click(getSend())
				expect(
					await screen.findByRole('button', {
						name: AUTH_ACTION_CONFIG.SENDING,
					}),
				).toBeDisabled()

				finish(EMAIL)
				const sent = await screen.findByRole('status')
				expect(sent).toHaveTextContent(
					`${AUTH_ACTION_CONFIG.EXPIRED_SENT_PREFIX} ${EMAIL}.`,
				)
				expect(
					screen.queryByText(AUTH_ACTION_CONFIG.EXPIRED_TEXT),
				).not.toBeInTheDocument()
				expect(
					screen.queryByRole('button', {
						name: AUTH_ACTION_CONFIG.SEND_NEW_LINK,
					}),
				).not.toBeInTheDocument()
				expect(
					getLink(AUTH_ACTION_CONFIG.GO_TO_TRAVELLERS),
				).toHaveAttribute('href', PATHS.TRAVELLERS)
				await waitFor(() =>
					expect(
						screen.getByRole('heading', { level: 1 }),
					).toHaveFocus(),
				)
			})

			it('shows why a resend failed and keeps the button', async () => {
				thunks.resend.mockResolvedValue(
					reject(ERROR_MESSAGES.TOO_MANY_EMAILS),
				)
				await renderExpired()

				fireEvent.click(getSend())
				expect(await screen.findByRole('alert')).toHaveTextContent(
					ERROR_MESSAGES.TOO_MANY_EMAILS,
				)
				expect(getSend()).toBeEnabled()
				expect(
					screen.getByText(AUTH_ACTION_CONFIG.EXPIRED_TEXT),
				).toBeInTheDocument()
			})
		})
	})

	describe('resetPassword', () => {
		it('shows the new password form for the account and focuses the field', async () => {
			thunks.check.mockResolvedValue(EMAIL)
			renderPage({ search: resetLink })

			await findHeading(AUTH_ACTION_CONFIG.RESET_TITLE)
			expect(
				screen.getByText(AUTH_ACTION_CONFIG.RESET_FOR(EMAIL)),
			).toBeInTheDocument()
			await waitFor(() => expect(getPassword()).toHaveFocus())
			expect(document.title).toBe(
				`${AUTH_ACTION_CONFIG.RESET_TITLE} · ${GLOBAL.SITE_NAME}`,
			)
		})

		it('saves the password and asks the user to log in', async () => {
			thunks.check.mockResolvedValue(EMAIL)
			thunks.confirm.mockResolvedValue(undefined)
			renderPage({ search: resetLink })
			await findHeading(AUTH_ACTION_CONFIG.RESET_TITLE)

			submitPassword()
			const heading = await findHeading(
				AUTH_ACTION_CONFIG.RESET_DONE_TITLE,
			)
			expect(thunks.confirm).toHaveBeenCalledWith({
				code: CODE,
				password: PASSWORD,
			})
			await waitFor(() => expect(heading).toHaveFocus())
			expect(
				screen.getByText(AUTH_ACTION_CONFIG.RESET_DONE_TEXT),
			).toBeInTheDocument()
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toBeInTheDocument()
		})

		it('shows a weak-password refusal as the field error', async () => {
			thunks.check.mockResolvedValue(EMAIL)
			thunks.confirm.mockResolvedValue(
				reject(ACTION_CODE_ERRORS.WEAK_PASSWORD),
			)
			renderPage({ search: resetLink })
			await findHeading(AUTH_ACTION_CONFIG.RESET_TITLE)

			submitPassword()
			expect(
				await screen.findByText(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT),
			).toBeInTheDocument()
			expect(getPassword()).toHaveAttribute('aria-invalid', 'true')
			await waitFor(() => expect(getPassword()).toHaveFocus())
		})

		it.each([ACTION_CODE_ERRORS.EXPIRED, ACTION_CODE_ERRORS.INVALID])(
			'offers a new reset link for a %s code',
			async (reason) => {
				thunks.check.mockResolvedValue(reject(reason))
				renderPage({ search: resetLink })

				await findHeading(AUTH_ACTION_CONFIG.RESET_EXPIRED_TITLE)
				expect(
					screen.getByText(AUTH_ACTION_CONFIG.RESET_EXPIRED_TEXT),
				).toBeInTheDocument()
				expect(
					getLink(AUTH_ACTION_CONFIG.RESET_PASSWORD),
				).toHaveAttribute('href', `${PATHS.AUTHENTICATION}?mode=reset`)
			},
		)

		it('offers a new reset link when the code expires before the save', async () => {
			thunks.check.mockResolvedValue(EMAIL)
			thunks.confirm.mockResolvedValue(reject(ACTION_CODE_ERRORS.EXPIRED))
			renderPage({ search: resetLink })
			await findHeading(AUTH_ACTION_CONFIG.RESET_TITLE)

			submitPassword()
			expect(
				await findHeading(AUTH_ACTION_CONFIG.RESET_EXPIRED_TITLE),
			).toBeInTheDocument()
		})

		it('saves the same password again on Try again after a network failure', async () => {
			thunks.check.mockResolvedValue(EMAIL)
			thunks.confirm
				.mockResolvedValueOnce(reject(ACTION_CODE_ERRORS.NETWORK))
				.mockResolvedValueOnce(undefined)
			renderPage({ search: resetLink })
			await findHeading(AUTH_ACTION_CONFIG.RESET_TITLE)

			submitPassword()
			await findHeading(AUTH_ACTION_CONFIG.NETWORK_TITLE)
			fireEvent.click(
				screen.getByRole('button', {
					name: AUTH_ACTION_CONFIG.TRY_AGAIN,
				}),
			)

			await findHeading(AUTH_ACTION_CONFIG.RESET_DONE_TITLE)
			expect(thunks.check).toHaveBeenCalledTimes(1)
			expect(thunks.confirm).toHaveBeenLastCalledWith({
				code: CODE,
				password: PASSWORD,
			})
		})
	})

	describe('verifyAndChangeEmail', () => {
		it('says the email has changed and asks to log in with the new address', async () => {
			thunks.applyChange.mockResolvedValue(NEW_EMAIL)
			renderPage({ search: changeLink, signedIn: true })

			const heading = await findHeading(
				AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE,
			)
			await waitFor(() => expect(heading).toHaveFocus())
			expect(thunks.applyChange).toHaveBeenCalledWith(CODE)
			expect(heading.parentElement).toHaveTextContent(
				`${AUTH_ACTION_CONFIG.EMAIL_CHANGED_PREFIX} ${NEW_EMAIL}${AUTH_ACTION_CONFIG.EMAIL_CHANGED_SUFFIX}`,
			)
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toHaveAttribute(
				'href',
				PATHS.AUTHENTICATION,
			)
		})

		it('applies the code once under StrictMode', async () => {
			thunks.applyChange.mockResolvedValue(NEW_EMAIL)
			renderPage({ search: changeLink, strict: true })

			await findHeading(AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE)
			expect(thunks.applyChange).toHaveBeenCalledTimes(1)
		})

		it.each([ACTION_CODE_ERRORS.EXPIRED, ACTION_CODE_ERRORS.INVALID])(
			'shows the invalid card for a %s link, with no new link to send',
			async (reason) => {
				thunks.applyChange.mockResolvedValue(reject(reason))
				renderPage({ search: changeLink, signedIn: true })

				await findHeading(AUTH_ACTION_CONFIG.INVALID_TITLE)
				expect(
					screen.queryByRole('button', {
						name: AUTH_ACTION_CONFIG.SEND_NEW_LINK,
					}),
				).not.toBeInTheDocument()
			},
		)

		it('checks the link again on Try again after a network failure', async () => {
			thunks.applyChange
				.mockResolvedValueOnce(reject(ACTION_CODE_ERRORS.NETWORK))
				.mockResolvedValueOnce(NEW_EMAIL)
			renderPage({ search: changeLink })

			await findHeading(AUTH_ACTION_CONFIG.NETWORK_TITLE)
			fireEvent.click(
				screen.getByRole('button', {
					name: AUTH_ACTION_CONFIG.TRY_AGAIN,
				}),
			)
			await findHeading(AUTH_ACTION_CONFIG.EMAIL_CHANGED_TITLE)
			expect(thunks.applyChange).toHaveBeenCalledTimes(2)
		})
	})

	describe('recoverEmail', () => {
		it('says the email is back and offers Log in and Reset your password', async () => {
			thunks.applyChange.mockResolvedValue(EMAIL)
			renderPage({ search: recoverLink })

			const heading = await findHeading(
				AUTH_ACTION_CONFIG.EMAIL_RECOVERED_TITLE,
			)
			expect(heading.parentElement).toHaveTextContent(
				`${AUTH_ACTION_CONFIG.EMAIL_RECOVERED_PREFIX} ${EMAIL}${AUTH_ACTION_CONFIG.EMAIL_RECOVERED_SUFFIX}`,
			)
			expect(getLink(AUTH_ACTION_CONFIG.LOG_IN)).toHaveAttribute(
				'href',
				PATHS.AUTHENTICATION,
			)
			expect(getLink(AUTH_ACTION_CONFIG.RESET_PASSWORD)).toHaveAttribute(
				'href',
				`${PATHS.AUTHENTICATION}?mode=reset`,
			)
		})
	})
})
