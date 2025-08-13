import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import { API_DATABASE } from '@/constants/api'
import {
	MOCK_API,
	MOCK_USER,
	MOCK_STORAGE_KEYS,
	MOCK_KEYS,
	MOCK_MESSAGES,
} from '@/constants/mock-data'

import authenticationReducer, {
	login,
	tryLogin,
	logout,
	autoLogout,
	authActions,
} from './authenticationSlice'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

vi.mock('@/constants/api', () => ({
	API_DATABASE: {
		API_URL: 'https://mock-api-url.com/',
		API_KEY: 'mock-api-key',
		POST: 'POST',
		API_AUTH_LOGIN_MODE: 'login',
		API_AUTH_SIGNUP_MODE: 'signup',
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

	describe('reducers', () => {
		it('should return the initial state', () => {
			const initialState = {
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				didAutoLogout: false,
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
			})
		})

		it('should handle setAutoLogout', () => {
			const previousState = {
				token: MOCK_USER.TOKEN,
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				didAutoLogout: false,
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
						mode: API_DATABASE.API_AUTH_LOGIN_MODE,
					},
					{
						description: 'non-empty string',
						displayName: 'Test User',
						mode: API_DATABASE.API_AUTH_LOGIN_MODE,
					},
					{
						description: 'empty string (signup)',
						displayName: '',
						mode: API_DATABASE.API_AUTH_SIGNUP_MODE,
					},
					{
						description: 'non-empty string (signup)',
						displayName: 'Test User',
						mode: API_DATABASE.API_AUTH_SIGNUP_MODE,
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
								mode === API_DATABASE.API_AUTH_SIGNUP_MODE
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
					const mockErrorMessage = MOCK_MESSAGES.INVALID_PASSWORD
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => ({
							error: { message: mockErrorMessage },
						}),
					})

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.API_AUTH_LOGIN_MODE,
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

					expect(result.payload).toBe(mockErrorMessage)
					expect(result.meta.rejectedWithValue).toBe(true)
				})

				it('should handle network errors', async () => {
					const mockError = new Error(MOCK_MESSAGES.NETWORK_ERROR)
					fetch.mockRejectedValueOnce(mockError)

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.API_AUTH_LOGIN_MODE,
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
		})
	})
})
