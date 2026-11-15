import { describe, it, expect, beforeEach, vi } from 'vitest'
import configureTestStore from '@/testUtils/configureTestStore'

import { API_DATABASE } from '@/constants/api'
import {
	MOCK_KEYS,
	MOCK_STORAGE_KEYS,
	MOCK_USER,
	MOCK_ERROR_MESSAGES,
} from '@/constants/test'

import { API_ERROR_MESSAGE } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

import authenticationReducer, {
	login,
	sendPasswordReset,
	resendVerification,
	refreshVerification,
	startAgain,
	applyEmailVerification,
	checkPasswordResetCode,
	confirmPasswordReset,
	tryLogin,
	logout,
	autoLogout,
	authActions,
	selectAuthenticationToken,
	selectUserProfile,
	selectIsAdmin,
} from './authenticationSlice'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

import {
	applyActionCode,
	confirmPasswordReset as confirmFirebasePasswordReset,
	createUserWithEmailAndPassword,
	deleteUser,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	verifyPasswordResetCode,
} from 'firebase/auth'

import { ACTION_CODE_ERRORS, SESSION_STORAGE_KEYS } from '@/constants/auth'

vi.mock('firebase/auth', () => ({
	applyActionCode: vi.fn(),
	confirmPasswordReset: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	deleteUser: vi.fn(),
	sendEmailVerification: vi.fn(() => Promise.resolve()),
	verifyPasswordResetCode: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	signOut: vi.fn(() => Promise.resolve()),
}))

const firebaseAuth = vi.hoisted(() => ({
	name: 'mock-auth',
	authStateReady: () => Promise.resolve(),
	currentUser: null,
}))

vi.mock('@/services/firebase/firebase', () => ({
	firebaseApp: {},
	getFirebaseAuth: () => firebaseAuth,
}))

vi.mock('@/constants/api', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		API_DATABASE: {
			URL: 'https://mock-api-url.com/',
			KEY: 'mock-api-key',
			POST: 'POST',
			AUTH_LOGIN_MODE: 'login',
			AUTH_SIGNUP_MODE: 'signup',
		},
		COMMON_HEADERS: {
			'Content-Type': 'application/json',
		},
	}
})

let store

const initialiseStore = () => {
	store = configureTestStore({
		reducer: {
			authentication: authenticationReducer,
		},
	})
}

setupMocks()

describe('authenticationSlice', () => {
	beforeEach(() => {
		initialiseStore()
		firebaseAuth.currentUser = { uid: MOCK_KEYS.LOCAL_ID }
	})

	describe('selectors', () => {
		it('should select authentication token from state', () => {
			const mockState = {
				authentication: {
					token: MOCK_KEYS.ID_TOKEN,
					userId: MOCK_KEYS.LOCAL_ID,
					userName: MOCK_USER.FULL_NAME,
					userEmail: MOCK_KEYS.EMAIL,
					didAutoLogout: false,
					status: 'succeeded',
					error: null,
				},
			}

			const result = selectAuthenticationToken(mockState)
			expect(result).toBe(MOCK_KEYS.ID_TOKEN)
		})

		it('should select user profile from state', () => {
			const mockState = {
				authentication: {
					token: MOCK_KEYS.ID_TOKEN,
					userId: MOCK_KEYS.LOCAL_ID,
					userName: MOCK_USER.FULL_NAME,
					userEmail: MOCK_KEYS.EMAIL,
					didAutoLogout: false,
					status: 'succeeded',
					error: null,
				},
			}
			const result = selectUserProfile(mockState)
			expect(result).toEqual({
				userId: MOCK_KEYS.LOCAL_ID,
				userName: MOCK_USER.FULL_NAME,
				userEmail: MOCK_KEYS.EMAIL,
			})
		})
	})

	describe('reducers', () => {
		it('should return the initial state', () => {
			const initialState = {
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				isAdmin: false,
				emailVerified: false,
				awaitingVerification: false,
				didAutoLogout: false,
				status: 'idle',
				error: null,
			}

			const state = authenticationReducer(undefined, { type: undefined })
			expect(state).toEqual(initialState)
		})

		it('should handle clearUser', () => {
			const previousState = {
				token: MOCK_USER.TOKEN,
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				didAutoLogout: false,
				status: 'succeeded',
				error: 'Test error message',
			}

			const state = authenticationReducer(
				previousState,
				authActions.clearUser(),
			)
			expect(state).toEqual({
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				isAdmin: false,
				emailVerified: false,
				awaitingVerification: false,
				didAutoLogout: false,
				status: 'idle',
				error: null,
			})
		})

		it('should handle setAutoLogout', () => {
			const previousState = {
				token: MOCK_USER.TOKEN,
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				didAutoLogout: false,
				status: 'succeeded',
				error: null,
			}

			const state = authenticationReducer(
				previousState,
				authActions.setAutoLogout(),
			)
			expect(state).toEqual({
				token: MOCK_USER.TOKEN,
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				didAutoLogout: true,
				status: 'succeeded',
				error: null,
			})
		})
	})

	describe('actions', () => {
		describe('login', () => {
			const credentials = {
				email: MOCK_KEYS.EMAIL,
				password: MOCK_KEYS.PASSWORD,
			}
			const expirationTime = new Date(
				Date.now() + MOCK_KEYS.EXPIRES_IN * 1000,
			).toUTCString()

			const mockUserCredential = (displayName, claims = {}) => ({
				user: {
					uid: MOCK_KEYS.LOCAL_ID,
					email: MOCK_KEYS.EMAIL,
					displayName,
					getIdTokenResult: vi.fn().mockResolvedValue({
						token: MOCK_KEYS.ID_TOKEN,
						expirationTime,
						claims,
					}),
				},
			})

			describe('success scenarios', () => {
				const loginTestCases = [
					{
						description: 'empty string',
						displayName: '',
						mode: API_DATABASE.AUTH_LOGIN_MODE,
						sdkMethod: signInWithEmailAndPassword,
					},
					{
						description: 'null',
						displayName: null,
						mode: API_DATABASE.AUTH_LOGIN_MODE,
						sdkMethod: signInWithEmailAndPassword,
					},
					{
						description: 'non-empty string',
						displayName: 'Test User',
						mode: API_DATABASE.AUTH_LOGIN_MODE,
						sdkMethod: signInWithEmailAndPassword,
					},
					{
						description: 'non-empty string (signup)',
						displayName: 'Test User',
						mode: API_DATABASE.AUTH_SIGNUP_MODE,
						sdkMethod: createUserWithEmailAndPassword,
					},
				]

				it.each(loginTestCases)(
					'signs in through the SDK when displayName is $description and mode is $mode',
					async ({ displayName, mode, sdkMethod }) => {
						sdkMethod.mockResolvedValueOnce(
							mockUserCredential(displayName),
						)

						await store.dispatch(login({ mode, ...credentials }))

						expect(sdkMethod).toHaveBeenCalledWith(
							firebaseAuth,
							MOCK_KEYS.EMAIL,
							MOCK_KEYS.PASSWORD,
						)

						const state = store.getState().authentication
						expect(state.token).toBe(MOCK_KEYS.ID_TOKEN)
						expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID)
						expect(state.userName).toBe(displayName || '')
						expect(state.userEmail).toBe(MOCK_KEYS.EMAIL)

						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.TOKEN,
							MOCK_KEYS.ID_TOKEN,
						)
						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.USER_ID,
							MOCK_KEYS.LOCAL_ID,
						)
						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.USER_NAME,
							displayName || '',
						)
						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.USER_EMAIL,
							MOCK_KEYS.EMAIL,
						)
						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.TOKEN_EXPIRATION,
							new Date(expirationTime).getTime(),
						)
					},
				)
			})

			describe('admin claim', () => {
				it.each([
					{
						description: 'present',
						claims: { admin: true },
						isAdmin: true,
					},
					{ description: 'absent', claims: {}, isAdmin: false },
					{
						description: 'not true',
						claims: { admin: 'yes' },
						isAdmin: false,
					},
				])(
					'sets isAdmin to $isAdmin when the claim is $description',
					async ({ claims, isAdmin }) => {
						signInWithEmailAndPassword.mockResolvedValueOnce(
							mockUserCredential('', claims),
						)

						await store.dispatch(
							login({
								mode: API_DATABASE.AUTH_LOGIN_MODE,
								...credentials,
							}),
						)

						expect(selectIsAdmin(store.getState())).toBe(isAdmin)
						expect(localStorage.setItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.IS_ADMIN,
							isAdmin,
						)
					},
				)
			})

			describe('failure scenarios', () => {
				it.each([
					[
						'auth/invalid-credential',
						ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
					],
					[
						'auth/wrong-password',
						ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
					],
					[
						'auth/user-not-found',
						ERROR_MESSAGES.INVALID_LOGIN_CREDENTIALS,
					],
					[
						'auth/too-many-requests',
						ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS,
					],
				])(
					'maps SDK code %s to %s on login',
					async (code, expected) => {
						signInWithEmailAndPassword.mockRejectedValueOnce({
							code,
						})

						const result = await store.dispatch(
							login({
								mode: API_DATABASE.AUTH_LOGIN_MODE,
								...credentials,
							}),
						)

						expect(result.payload).toBe(expected)
						expect(result.meta.rejectedWithValue).toBe(true)
					},
				)

				it('maps an existing email on signup to the email-in-use message', async () => {
					createUserWithEmailAndPassword.mockRejectedValueOnce({
						code: 'auth/email-already-in-use',
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_SIGNUP_MODE,
							...credentials,
						}),
					)

					expect(result.payload).toBe(
						ERROR_MESSAGES.EMAIL_ALREADY_IN_USE,
					)
				})

				it('shows the generic sign-in message for an unmapped SDK code', async () => {
					signInWithEmailAndPassword.mockRejectedValueOnce({
						code: 'auth/user-disabled',
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							...credentials,
						}),
					)

					expect(result.payload).toBe(ERROR_MESSAGES.LOGIN_FAILED)
				})

				it('records the error when the autoLogout action is rejected', async () => {
					const mockErrorMessage =
						MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR

					const action = {
						type: autoLogout.rejected.type,
						payload: mockErrorMessage,
					}
					const previousState = {
						token: MOCK_USER.TOKEN,
						userId: MOCK_USER.USER_ID,
						userName: MOCK_USER.USER_NAME,
						userEmail: MOCK_USER.USER_EMAIL,
						didAutoLogout: false,
						status: 'succeeded',
						error: null,
					}
					const state = authenticationReducer(previousState, action)
					expect(state.status).toBe('failed')
					expect(state.error).toBe(mockErrorMessage)
				})

				it('uses the fallback when an error has no code or message', async () => {
					signInWithEmailAndPassword.mockRejectedValueOnce({})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							...credentials,
						}),
					)

					expect(result.payload).toBe(ERROR_MESSAGES.LOGIN_FAILED)
				})

				it('tells the user to check their connection when the network is down', async () => {
					signInWithEmailAndPassword.mockRejectedValueOnce({
						code: 'auth/network-request-failed',
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							...credentials,
						}),
					)

					expect(result.payload).toBe(
						ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
					)
				})

				it('should hide a raw error message and leave state unchanged', async () => {
					const mockError = new Error(API_ERROR_MESSAGE.NETWORK_ERROR)
					signInWithEmailAndPassword.mockRejectedValueOnce(mockError)

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							...credentials,
						}),
					)

					const state = store.getState().authentication
					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()

					expect(result.payload).toBe(ERROR_MESSAGES.LOGIN_FAILED)
					expect(result.meta.rejectedWithValue).toBe(true)
				})
			})
		})

		describe('tryLogin', () => {
			describe('success scenarios', () => {
				const tryLoginTestCases = [
					{
						description: 'empty string',
						displayName: '',
					},
					{
						description: 'non-empty string',
						displayName: 'Test User',
					},
				]

				describe.each(tryLoginTestCases)(
					'tryLogin test cases',
					({ description, displayName }) => {
						it(`should restore user details from localStorage when displayName is ${description}`, async () => {
							localStorage.getItem.mockImplementation((key) => {
								switch (key) {
									case MOCK_STORAGE_KEYS.TOKEN:
										return MOCK_KEYS.ID_TOKEN
									case MOCK_STORAGE_KEYS.USER_ID:
										return MOCK_KEYS.LOCAL_ID
									case MOCK_STORAGE_KEYS.USER_NAME:
										return displayName
									case MOCK_STORAGE_KEYS.USER_EMAIL:
										return MOCK_KEYS.EMAIL
									case MOCK_STORAGE_KEYS.TOKEN_EXPIRATION:
										return MOCK_KEYS.EXPIRATION.toString()
									default:
										return null
								}
							})

							await store.dispatch(tryLogin())

							const state = store.getState().authentication

							expect(state.token).toBe(MOCK_KEYS.ID_TOKEN)
							expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID)
							expect(state.userName).toBe(displayName)
							expect(state.userEmail).toBe(MOCK_KEYS.EMAIL)
						})
					},
				)

				it.each([
					{ stored: 'true', isAdmin: true },
					{ stored: 'false', isAdmin: false },
					{ stored: null, isAdmin: false },
				])(
					'restores isAdmin as $isAdmin when the stored value is $stored',
					async ({ stored, isAdmin }) => {
						localStorage.getItem.mockImplementation((key) => {
							switch (key) {
								case MOCK_STORAGE_KEYS.TOKEN:
									return MOCK_KEYS.ID_TOKEN
								case MOCK_STORAGE_KEYS.USER_ID:
									return MOCK_KEYS.LOCAL_ID
								case MOCK_STORAGE_KEYS.TOKEN_EXPIRATION:
									return MOCK_KEYS.EXPIRATION.toString()
								case MOCK_STORAGE_KEYS.IS_ADMIN:
									return stored
								default:
									return null
							}
						})

						await store.dispatch(tryLogin())

						expect(selectIsAdmin(store.getState())).toBe(isAdmin)
					},
				)

				it.each([
					{ description: 'no Auth SDK user', currentUser: null },
					{
						description: 'an Auth SDK user with a different uid',
						currentUser: { uid: 'another-uid' },
					},
				])(
					'logs out instead of restoring the session when there is $description',
					async ({ currentUser }) => {
						firebaseAuth.currentUser = currentUser
						localStorage.getItem.mockImplementation((key) => {
							switch (key) {
								case MOCK_STORAGE_KEYS.TOKEN:
									return MOCK_KEYS.ID_TOKEN
								case MOCK_STORAGE_KEYS.USER_ID:
									return MOCK_KEYS.LOCAL_ID
								case MOCK_STORAGE_KEYS.TOKEN_EXPIRATION:
									return MOCK_KEYS.EXPIRATION.toString()
								default:
									return null
							}
						})

						const result = await store.dispatch(tryLogin())

						const state = store.getState().authentication
						expect(result.payload).toBeNull()
						expect(state.token).toBeNull()
						expect(state.userId).toBeNull()
						expect(state.didAutoLogout).toBe(false)
						expect(localStorage.removeItem).toHaveBeenCalledWith(
							MOCK_STORAGE_KEYS.TOKEN,
						)
						expect(signOut).toHaveBeenCalledWith(firebaseAuth)
					},
				)

				it('should handle expired token', async () => {
					localStorage.getItem.mockImplementation((key) => {
						switch (key) {
							case MOCK_STORAGE_KEYS.TOKEN_EXPIRATION:
								return (new Date().getTime() - 1000).toString()
							default:
								return null
						}
					})

					await store.dispatch(tryLogin())

					const state = store.getState().authentication

					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()
				})

				it('should handle empty localStorage during tryLogin', async () => {
					localStorage.getItem.mockImplementation(() => null)

					await store.dispatch(tryLogin())

					const state = store.getState().authentication

					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()
					expect(state.didAutoLogout).toBe(false)
				})

				it('should clear user details and set didAutoLogout when autoLogout is dispatched after tryLogin', async () => {
					await store.dispatch(autoLogout())

					const state = store.getState().authentication

					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()
					expect(state.didAutoLogout).toBe(true)
				})
			})

			describe('failure scenarios', () => {
				it('should handle tryLogin failure and set error state', async () => {
					localStorage.getItem.mockImplementation(() => {
						throw new Error(MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR)
					})

					const result = await store.dispatch(tryLogin())

					const state = store.getState().authentication
					expect(state.status).toBe('failed')
					expect(state.error).toBe(
						MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR,
					)
					expect(result.meta.rejectedWithValue).toBe(true)
				})
			})
		})

		describe('logout', () => {
			describe('success scenarios', () => {
				it('should clear user details and localStorage', async () => {
					await store.dispatch(logout())

					const state = store.getState().authentication

					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()
					expect(signOut).toHaveBeenCalledWith(firebaseAuth)

					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.TOKEN,
					)
					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.USER_ID,
					)
					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.USER_NAME,
					)
					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.USER_EMAIL,
					)
					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.TOKEN_EXPIRATION,
					)
					expect(localStorage.removeItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.IS_ADMIN,
					)
					expect(state.isAdmin).toBe(false)
				})
			})

			describe('failure scenarios', () => {
				it('should handle logout failure and set error state', async () => {
					localStorage.removeItem.mockImplementation(() => {
						throw new Error(MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR)
					})

					const result = await store.dispatch(logout())

					const state = store.getState().authentication
					expect(state.status).toBe('failed')
					expect(state.error).toBe(
						MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR,
					)
					expect(result.meta.rejectedWithValue).toBe(true)
				})
			})
		})

		describe('autoLogout', () => {
			describe('success scenarios', () => {
				it('should clear user details and set didAutoLogout when autoLogout is dispatched after tryLogin', async () => {
					await store.dispatch(autoLogout())

					const state = store.getState().authentication

					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()
					expect(state.didAutoLogout).toBe(true)
				})
			})

			describe('timer functionality', () => {
				let setTimeoutSpy
				let clearTimeoutSpy

				beforeEach(() => {
					vi.useFakeTimers()
					setTimeoutSpy = vi.spyOn(global, 'setTimeout')
					clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
				})

				afterEach(() => {
					vi.useRealTimers()
					setTimeoutSpy.mockRestore()
					clearTimeoutSpy.mockRestore()
				})

				it('should set timer and dispatch autoLogout when timer expires after successful login', async () => {
					const expiresInMs = +MOCK_KEYS.EXPIRES_IN * 1000
					signInWithEmailAndPassword.mockResolvedValueOnce({
						user: {
							uid: MOCK_KEYS.LOCAL_ID,
							email: MOCK_KEYS.EMAIL,
							displayName: MOCK_USER.FULL_NAME,
							getIdTokenResult: vi.fn().mockResolvedValue({
								token: MOCK_KEYS.ID_TOKEN,
								expirationTime: new Date(
									Date.now() + expiresInMs,
								).toISOString(),
							}),
						},
					})

					await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					)

					// Verify initial state after login
					let state = store.getState().authentication
					expect(state.token).toBe(MOCK_KEYS.ID_TOKEN)
					expect(state.didAutoLogout).toBe(false)

					// Verify setTimeout was called with correct duration
					const [timerCallback, delay] = setTimeoutSpy.mock.calls[0]
					expect(delay).toBeGreaterThan(expiresInMs - 1000)
					expect(delay).toBeLessThanOrEqual(expiresInMs)

					// Execute the callback to trigger autoLogout
					await timerCallback()

					// Verify autoLogout was executed and state was updated
					state = store.getState().authentication
					expect(state.token).toBeNull()
					expect(state.didAutoLogout).toBe(true)
				})

				it('should set timer and dispatch autoLogout when timer expires during tryLogin', async () => {
					const futureExpiration = new Date().getTime() + 60000 // 1 minute from now

					localStorage.getItem.mockImplementation((key) => {
						switch (key) {
							case MOCK_STORAGE_KEYS.TOKEN:
								return MOCK_KEYS.ID_TOKEN
							case MOCK_STORAGE_KEYS.USER_ID:
								return MOCK_KEYS.LOCAL_ID
							case MOCK_STORAGE_KEYS.USER_NAME:
								return MOCK_USER.FULL_NAME
							case MOCK_STORAGE_KEYS.USER_EMAIL:
								return MOCK_KEYS.EMAIL
							case MOCK_STORAGE_KEYS.TOKEN_EXPIRATION:
								return futureExpiration.toString()
							default:
								return null
						}
					})

					await store.dispatch(tryLogin())

					// Verify initial state after tryLogin
					let state = store.getState().authentication
					expect(state.token).toBe(MOCK_KEYS.ID_TOKEN)
					expect(state.didAutoLogout).toBe(false)

					// Verify setTimeout was called with correct duration (60000ms)
					expect(setTimeoutSpy).toHaveBeenCalledWith(
						expect.any(Function),
						60000,
					)

					// Get the callback function from setTimeout
					const timerCallback = setTimeoutSpy.mock.calls[0][0]

					// Execute the callback to trigger autoLogout
					await timerCallback()

					// Verify autoLogout was executed and state was updated
					state = store.getState().authentication
					expect(state.token).toBeNull()
					expect(state.didAutoLogout).toBe(true)
				})
			})
		})
	})

	describe('sendPasswordReset', () => {
		it('sends the reset email and resolves with the address', async () => {
			sendPasswordResetEmail.mockResolvedValueOnce()

			const result = await store.dispatch(
				sendPasswordReset(MOCK_KEYS.EMAIL),
			)

			expect(sendPasswordResetEmail).toHaveBeenCalledWith(
				firebaseAuth,
				MOCK_KEYS.EMAIL,
			)
			expect(result.payload).toBe(MOCK_KEYS.EMAIL)
		})

		it('answers an unknown address like a sent link, so it never says whether an account exists', async () => {
			sendPasswordResetEmail.mockRejectedValueOnce({
				code: 'auth/user-not-found',
			})

			const result = await store.dispatch(
				sendPasswordReset(MOCK_KEYS.EMAIL),
			)

			expect(sendPasswordReset.fulfilled.match(result)).toBe(true)
		})

		it.each([
			['auth/too-many-requests', ERROR_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS],
			[
				'auth/network-request-failed',
				ERROR_MESSAGES.PASSWORD_RESET_FAILED,
			],
		])(
			'rejects %s with a message the user can act on',
			async (code, message) => {
				sendPasswordResetEmail.mockRejectedValueOnce({ code })

				const result = await store.dispatch(
					sendPasswordReset(MOCK_KEYS.EMAIL),
				)

				expect(result.payload).toBe(message)
			},
		)
	})

	describe('email verification', () => {
		const sessionUser = (overrides = {}) => ({
			uid: MOCK_KEYS.LOCAL_ID,
			email: MOCK_KEYS.EMAIL,
			displayName: '',
			emailVerified: false,
			reload: vi.fn(() => Promise.resolve()),
			getIdTokenResult: vi.fn().mockResolvedValue({
				token: 'fresh-token',
				expirationTime: new Date(Date.now() + 3600000).toISOString(),
				claims: {},
			}),
			...overrides,
		})

		beforeEach(() => {
			localStorage.getItem.mockImplementation((key) =>
				key === SESSION_STORAGE_KEYS.USER_ID
					? MOCK_KEYS.LOCAL_ID
					: null,
			)
		})

		it('sends the verification email on sign-up and waits on Check your inbox', async () => {
			const user = sessionUser()
			createUserWithEmailAndPassword.mockResolvedValueOnce({ user })

			await store.dispatch(
				login({
					mode: API_DATABASE.AUTH_SIGNUP_MODE,
					email: MOCK_KEYS.EMAIL,
					password: MOCK_KEYS.PASSWORD,
				}),
			)

			expect(sendEmailVerification).toHaveBeenCalledWith(user)
			const state = store.getState().authentication
			expect(state.awaitingVerification).toBe(true)
			expect(state.emailVerified).toBe(false)
		})

		it('still signs up when the first email fails, so Check your inbox can send another', async () => {
			createUserWithEmailAndPassword.mockResolvedValueOnce({
				user: sessionUser(),
			})
			sendEmailVerification.mockRejectedValueOnce({
				code: 'auth/network-request-failed',
			})

			const result = await store.dispatch(
				login({
					mode: API_DATABASE.AUTH_SIGNUP_MODE,
					email: MOCK_KEYS.EMAIL,
					password: MOCK_KEYS.PASSWORD,
				}),
			)

			expect(login.fulfilled.match(result)).toBe(true)
		})

		it('sends no email on log in', async () => {
			signInWithEmailAndPassword.mockResolvedValueOnce({
				user: sessionUser({ emailVerified: true }),
			})

			await store.dispatch(
				login({
					mode: API_DATABASE.AUTH_LOGIN_MODE,
					email: MOCK_KEYS.EMAIL,
					password: MOCK_KEYS.PASSWORD,
				}),
			)

			expect(sendEmailVerification).not.toHaveBeenCalled()
			const state = store.getState().authentication
			expect(state.awaitingVerification).toBe(false)
			expect(state.emailVerified).toBe(true)
		})

		it.each([
			['auth/too-many-requests', ERROR_MESSAGES.TOO_MANY_EMAILS],
			[
				'auth/network-request-failed',
				ERROR_MESSAGES.VERIFICATION_EMAIL_FAILED,
			],
		])('rejects a resend with %s as a message', async (code, message) => {
			firebaseAuth.currentUser = sessionUser()
			sendEmailVerification.mockRejectedValueOnce({ code })

			const result = await store.dispatch(resendVerification())

			expect(result.payload).toBe(message)
		})

		it('refreshes the token once the address is verified, so the rules see it', async () => {
			const user = sessionUser()
			user.reload.mockImplementationOnce(async () => {
				user.emailVerified = true
			})
			firebaseAuth.currentUser = user

			const result = await store.dispatch(refreshVerification())

			expect(user.getIdTokenResult).toHaveBeenCalledWith(true)
			expect(result.payload.emailVerified).toBe(true)
			const state = store.getState().authentication
			expect(state.emailVerified).toBe(true)
			expect(state.token).toBe('fresh-token')
			expect(localStorage.setItem).toHaveBeenCalledWith(
				SESSION_STORAGE_KEYS.TOKEN,
				'fresh-token',
			)
		})

		it('leaves the token alone while the address is unverified', async () => {
			const user = sessionUser()
			firebaseAuth.currentUser = user

			const result = await store.dispatch(refreshVerification())

			expect(result.payload).toEqual({ emailVerified: false })
			expect(user.getIdTokenResult).not.toHaveBeenCalled()
		})

		it('deletes the new account and signs out on Start again', async () => {
			const user = sessionUser()
			firebaseAuth.currentUser = user
			deleteUser.mockResolvedValueOnce()

			const result = await store.dispatch(startAgain())

			expect(deleteUser).toHaveBeenCalledWith(user)
			expect(localStorage.removeItem).toHaveBeenCalledWith(
				SESSION_STORAGE_KEYS.TOKEN,
			)
			expect(result.payload).toBe(MOCK_KEYS.EMAIL)
		})

		it('applies the link and refreshes a signed-in session', async () => {
			const user = sessionUser()
			user.reload.mockImplementation(async () => {
				user.emailVerified = true
			})
			firebaseAuth.currentUser = user
			applyActionCode.mockResolvedValueOnce()

			const result = await store.dispatch(applyEmailVerification('code'))

			expect(applyActionCode).toHaveBeenCalledWith(firebaseAuth, 'code')
			expect(result.payload).toEqual({
				signedIn: true,
				alreadyVerified: false,
			})
			expect(store.getState().authentication.emailVerified).toBe(true)
		})

		it('applies the link signed out, on another device', async () => {
			firebaseAuth.currentUser = null
			applyActionCode.mockResolvedValueOnce()

			const result = await store.dispatch(applyEmailVerification('code'))

			expect(result.payload).toEqual({
				signedIn: false,
				alreadyVerified: false,
			})
		})

		it('treats a used link as done when the account is already verified', async () => {
			firebaseAuth.currentUser = sessionUser({ emailVerified: true })
			applyActionCode.mockRejectedValueOnce({
				code: 'auth/invalid-action-code',
			})

			const result = await store.dispatch(applyEmailVerification('code'))

			expect(result.payload).toEqual({
				signedIn: true,
				alreadyVerified: true,
			})
		})

		it.each([
			['auth/expired-action-code', ACTION_CODE_ERRORS.EXPIRED],
			['auth/invalid-action-code', ACTION_CODE_ERRORS.EXPIRED],
			['auth/network-request-failed', ACTION_CODE_ERRORS.NETWORK],
			['auth/internal-error', ACTION_CODE_ERRORS.INVALID],
		])('rejects a failed link (%s) with a reason', async (code, reason) => {
			firebaseAuth.currentUser = sessionUser()
			applyActionCode.mockRejectedValueOnce({ code })

			const result = await store.dispatch(applyEmailVerification('code'))

			expect(result.payload).toBe(reason)
		})

		it('resolves a reset code to its address', async () => {
			verifyPasswordResetCode.mockResolvedValueOnce(MOCK_KEYS.EMAIL)

			const result = await store.dispatch(checkPasswordResetCode('code'))

			expect(result.payload).toBe(MOCK_KEYS.EMAIL)
		})

		it('rejects a weak new password with a reason the form shows', async () => {
			confirmFirebasePasswordReset.mockRejectedValueOnce({
				code: 'auth/weak-password',
			})

			const result = await store.dispatch(
				confirmPasswordReset({ code: 'code', password: 'abc' }),
			)

			expect(confirmFirebasePasswordReset).toHaveBeenCalledWith(
				firebaseAuth,
				'code',
				'abc',
			)
			expect(result.payload).toBe(ACTION_CODE_ERRORS.WEAK_PASSWORD)
		})
	})
})
