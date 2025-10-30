import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import { API_DATABASE } from '@/constants/api'
import {
	MOCK_API,
	MOCK_KEYS,
	MOCK_STORAGE_KEYS,
	MOCK_USER,
	MOCK_ERROR_MESSAGES,
} from '@/constants/test'

import { ERROR_MESSAGES } from '@/constants/errors'

import authenticationReducer, {
	login,
	tryLogin,
	logout,
	autoLogout,
	authActions,
	selectAuthenticationToken,
} from './authenticationSlice'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

vi.mock('@/constants/api', () => ({
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
}))

let store

const initializeStore = () => {
	store = configureStore({
		reducer: {
			authentication: authenticationReducer,
		},
	})
}

setupMocks()

describe('authenticationSlice', () => {
	beforeEach(() => {
		initializeStore()
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

		it('should return null when no token in state', () => {
			const mockState = {
				authentication: {
					token: null,
					userId: null,
					userName: null,
					userEmail: null,
					didAutoLogout: false,
					status: 'idle',
					error: null,
				},
			}

			const result = selectAuthenticationToken(mockState)
			expect(result).toBeNull()
		})
	})

	describe('reducers', () => {
		it('should return the initial state', () => {
			const initialState = {
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
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
			describe('success scenarios', () => {
				const loginTestCases = [
					{
						description: 'empty string',
						displayName: '',
						mode: API_DATABASE.AUTH_LOGIN_MODE,
					},
					{
						description: 'non-empty string',
						displayName: 'Test User',
						mode: API_DATABASE.AUTH_LOGIN_MODE,
					},
					{
						description: 'empty string (signup)',
						displayName: '',
						mode: API_DATABASE.AUTH_SIGNUP_MODE,
					},
					{
						description: 'non-empty string (signup)',
						displayName: 'Test User',
						mode: API_DATABASE.AUTH_SIGNUP_MODE,
					},
				]

				describe.each(loginTestCases)(
					'login test cases',
					({ description, displayName, mode }) => {
						it(`should handle login success when displayName is ${description} and mode is ${mode}`, async () => {
							const mockResponse = {
								idToken: MOCK_KEYS.ID_TOKEN,
								localId: MOCK_KEYS.LOCAL_ID,
								displayName: displayName,
								email: MOCK_KEYS.EMAIL,
								expiresIn: MOCK_KEYS.EXPIRES_IN,
							}

							fetch.mockResolvedValueOnce({
								ok: true,
								json: async () => mockResponse,
							})

							await store.dispatch(
								login({
									mode,
									email: MOCK_KEYS.EMAIL,
									password: MOCK_KEYS.PASSWORD,
								}),
							)

							const expectedUrl =
								mode === API_DATABASE.AUTH_SIGNUP_MODE
									? `${MOCK_API.URL}signUp?key=${MOCK_API.KEY}`
									: `${MOCK_API.URL}signInWithPassword?key=${MOCK_API.KEY}`

							expect(fetch).toHaveBeenCalledWith(
								expectedUrl,
								expect.objectContaining({
									method: API_DATABASE.POST,
									body: JSON.stringify({
										email: MOCK_KEYS.EMAIL,
										password: MOCK_KEYS.PASSWORD,
										returnSecureToken: true,
									}),
								}),
							)

							const state = store.getState().authentication
							expect(state.token).toBe(MOCK_KEYS.ID_TOKEN)
							expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID)
							expect(state.userName).toBe(displayName)
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
								displayName,
							)
							expect(localStorage.setItem).toHaveBeenCalledWith(
								MOCK_STORAGE_KEYS.USER_EMAIL,
								MOCK_KEYS.EMAIL,
							)
						})
					},
				)
			})

			describe('failure scenarios', () => {
				it('should handle login failure and return error message', async () => {
					const mockErrorMessage = ERROR_MESSAGES.INVALID_PASSWORD
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => ({
							error: { message: mockErrorMessage },
						}),
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					)

					expect(result.payload).toBe(mockErrorMessage)
					expect(result.meta.rejectedWithValue).toBe(true)
				})

				it('should handle login failure with missing error message and use fallback', async () => {
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => ({
							error: { message: null }, // or message: undefined, or no message property
						}),
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					)

					expect(result.payload).toBe(
						ERROR_MESSAGES.LOGIN_FAILED_FALLBACK,
					)
					expect(result.meta.rejectedWithValue).toBe(true)
				})

				it('should handle network errors', async () => {
					const mockError = new Error(ERROR_MESSAGES.NETWORK_ERROR)
					fetch.mockRejectedValueOnce(mockError)

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					)

					expect(fetch).toHaveBeenCalledWith(
						`${MOCK_API.URL}signInWithPassword?key=${MOCK_API.KEY}`,
						expect.objectContaining({
							method: API_DATABASE.POST,
							body: JSON.stringify({
								email: MOCK_KEYS.EMAIL,
								password: MOCK_KEYS.PASSWORD,
								returnSecureToken: true,
							}),
						}),
					)

					const state = store.getState().authentication
					expect(state.token).toBeNull()
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()

					expect(result.payload).toBe(mockError.message)
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

				it('should clear user details and set didAutoLogout to true', async () => {
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
				it('should clear user details and set didAutoLogout to true', async () => {
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
					const mockResponse = {
						idToken: MOCK_KEYS.ID_TOKEN,
						localId: MOCK_KEYS.LOCAL_ID,
						displayName: MOCK_USER.FULL_NAME,
						email: MOCK_KEYS.EMAIL,
						expiresIn: MOCK_KEYS.EXPIRES_IN,
					}

					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () => mockResponse,
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
					expect(setTimeoutSpy).toHaveBeenCalledWith(
						expect.any(Function),
						+MOCK_KEYS.EXPIRES_IN * 1000,
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
})
