import { describe, it, expect, beforeEach, vi } from 'vitest'
import configureTestStore from '@/testUtils/configureTestStore'

import { API_DATABASE } from '@/constants/api'
import { MOCK_KEYS, MOCK_USER, MOCK_ERROR_MESSAGES } from '@/constants/test'

import { API_ERROR_MESSAGE } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'
import { PATHS } from '@/constants/ui'

import authenticationReducer, {
	login,
	sendPasswordReset,
	resendVerification,
	refreshVerification,
	startAgain,
	applyEmailVerification,
	checkPasswordResetCode,
	confirmPasswordReset,
	logout,
	watchSession,
	getSessionToken,
	restoreSavedSession,
	authActions,
	selectIsAuthenticated,
	selectUserProfile,
	selectIsAdmin,
} from './authenticationSlice'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

import {
	applyActionCode,
	confirmPasswordReset as confirmFirebasePasswordReset,
	createUserWithEmailAndPassword,
	deleteUser,
	onIdTokenChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	verifyPasswordResetCode,
} from 'firebase/auth'

import { ACTION_CODE_ERRORS } from '@/constants/auth'

vi.mock('firebase/auth', () => ({
	applyActionCode: vi.fn(),
	confirmPasswordReset: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	deleteUser: vi.fn(),
	onIdTokenChanged: vi.fn(() => () => {}),
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

const ORIGIN = 'https://trip-fotos.example'

describe('authenticationSlice', () => {
	beforeEach(() => {
		initialiseStore()
		firebaseAuth.currentUser = { uid: MOCK_KEYS.LOCAL_ID }
	})

	describe('selectors', () => {
		it('counts a user ID as signed in', () => {
			expect(
				selectIsAuthenticated({
					authentication: { userId: MOCK_KEYS.LOCAL_ID },
				}),
			).toBe(true)
			expect(
				selectIsAuthenticated({ authentication: { userId: null } }),
			).toBe(false)
		})

		it('should select user profile from state', () => {
			const mockState = {
				authentication: {
					userId: MOCK_KEYS.LOCAL_ID,
					userName: MOCK_USER.FULL_NAME,
					userEmail: MOCK_KEYS.EMAIL,
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
				userId: null,
				userName: null,
				userEmail: null,
				isAdmin: false,
				emailVerified: false,
				awaitingVerification: false,
				sessionChecked: true,
				signingIn: false,
				status: 'idle',
				error: null,
			}

			const state = authenticationReducer(undefined, { type: undefined })
			expect(state).toEqual(initialState)
		})

		it('should handle clearUser, marking the session as checked', () => {
			const previousState = {
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				isAdmin: true,
				sessionChecked: true,
				status: 'succeeded',
				error: 'Test error message',
			}

			const state = authenticationReducer(
				previousState,
				authActions.clearUser(),
			)
			expect(state).toEqual({
				userId: null,
				userName: null,
				userEmail: null,
				isAdmin: false,
				emailVerified: false,
				awaitingVerification: false,
				sessionChecked: true,
				signingIn: false,
				status: 'idle',
				error: null,
			})
		})

		it('leaves setSession to the sign-in result while one is in flight, so sign-up keeps Check your inbox', () => {
			const session = {
				userId: MOCK_USER.USER_ID,
				userName: '',
				userEmail: MOCK_USER.USER_EMAIL,
				isAdmin: false,
				emailVerified: false,
			}
			let state = authenticationReducer(undefined, {
				type: login.pending.type,
			})

			state = authenticationReducer(
				state,
				authActions.setSession(session),
			)
			expect(state.userId).toBeNull()

			state = authenticationReducer(state, {
				type: login.fulfilled.type,
				payload: { ...session, awaitingVerification: true },
			})
			expect(state).toMatchObject({
				userId: MOCK_USER.USER_ID,
				awaitingVerification: true,
				signingIn: false,
			})

			state = authenticationReducer(
				state,
				authActions.setSession(session),
			)
			expect(state.awaitingVerification).toBe(true)
		})

		it('takes the SDK session again once a sign-in has failed', () => {
			let state = authenticationReducer(undefined, {
				type: login.pending.type,
			})
			state = authenticationReducer(state, {
				type: login.rejected.type,
				payload: 'failed',
			})

			state = authenticationReducer(
				state,
				authActions.setSession({
					userId: MOCK_USER.USER_ID,
					userName: '',
					userEmail: MOCK_USER.USER_EMAIL,
					isAdmin: false,
					emailVerified: false,
				}),
			)

			expect(state.userId).toBe(MOCK_USER.USER_ID)
		})

		it('should handle setSession, keeping Check your inbox', () => {
			const previousState = {
				...authenticationReducer(undefined, { type: undefined }),
				sessionChecked: false,
			}

			const state = authenticationReducer(
				{ ...previousState, awaitingVerification: true },
				authActions.setSession({
					userId: MOCK_USER.USER_ID,
					userName: MOCK_USER.USER_NAME,
					userEmail: MOCK_USER.USER_EMAIL,
					isAdmin: true,
					emailVerified: false,
				}),
			)
			expect(state).toMatchObject({
				userId: MOCK_USER.USER_ID,
				userName: MOCK_USER.USER_NAME,
				userEmail: MOCK_USER.USER_EMAIL,
				isAdmin: true,
				emailVerified: false,
				awaitingVerification: true,
				sessionChecked: true,
			})
		})

		it('should handle awaitVerification, then clearAwaitingVerification', () => {
			let state = authenticationReducer(
				undefined,
				authActions.awaitVerification(),
			)
			expect(state.awaitingVerification).toBe(true)

			state = authenticationReducer(
				state,
				authActions.clearAwaitingVerification(),
			)
			expect(state.awaitingVerification).toBe(false)
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
						expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID)
						expect(state.userName).toBe(displayName || '')
						expect(state.userEmail).toBe(MOCK_KEYS.EMAIL)
						expect(state.sessionChecked).toBe(true)
						expect(state).not.toHaveProperty('token')

						expect(localStorage.setItem).not.toHaveBeenCalled()
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
					expect(state.userId).toBeNull()
					expect(state.userName).toBeNull()
					expect(state.userEmail).toBeNull()

					expect(result.payload).toBe(ERROR_MESSAGES.LOGIN_FAILED)
					expect(result.meta.rejectedWithValue).toBe(true)
				})
			})
		})

		describe('watchSession', () => {
			const sdkUser = (overrides = {}) => ({
				uid: MOCK_KEYS.LOCAL_ID,
				email: MOCK_KEYS.EMAIL,
				displayName: MOCK_USER.FULL_NAME,
				emailVerified: true,
				getIdTokenResult: vi
					.fn()
					.mockResolvedValue({ claims: { admin: true } }),
				...overrides,
			})

			// The listener the slice registered, called as the SDK would
			const report = async (user) => {
				firebaseAuth.currentUser = user
				await onIdTokenChanged.mock.calls.at(-1)[1](user)
			}

			it('listens to the SDK and returns its unsubscribe', () => {
				const unsubscribe = vi.fn()
				onIdTokenChanged.mockReturnValueOnce(unsubscribe)

				const result = store.dispatch(watchSession())

				expect(onIdTokenChanged).toHaveBeenCalledWith(
					firebaseAuth,
					expect.any(Function),
				)
				expect(result).toBe(unsubscribe)
			})

			it('removes the keys the app used to keep its own session under', () => {
				store.dispatch(watchSession())

				for (const key of [
					'token',
					'userId',
					'userName',
					'userEmail',
					'isAdmin',
				]) {
					expect(localStorage.removeItem).toHaveBeenCalledWith(key)
				}
			})

			it('sets the user, with isAdmin from the token claims, when the SDK reports one', async () => {
				store.dispatch(watchSession())

				await report(sdkUser())

				expect(store.getState().authentication).toMatchObject({
					userId: MOCK_KEYS.LOCAL_ID,
					userName: MOCK_USER.FULL_NAME,
					userEmail: MOCK_KEYS.EMAIL,
					isAdmin: true,
					emailVerified: true,
					sessionChecked: true,
				})
				expect(localStorage.setItem).not.toHaveBeenCalled()
			})

			it('keeps the user, without admin, when the claims cannot be read offline', async () => {
				store.dispatch(watchSession())

				await report(
					sdkUser({
						getIdTokenResult: vi.fn().mockRejectedValue({
							code: 'auth/network-request-failed',
						}),
					}),
				)

				const state = store.getState().authentication
				expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID)
				expect(state.isAdmin).toBe(false)
				expect(signOut).not.toHaveBeenCalled()
			})

			it('clears the user when the SDK reports none (logged out, revoked or disabled)', async () => {
				store.dispatch(watchSession())
				await report(sdkUser())

				await report(null)

				const state = store.getState().authentication
				expect(state.userId).toBeNull()
				expect(state.isAdmin).toBe(false)
				expect(state.sessionChecked).toBe(true)
			})

			it('ignores a user whose claims arrive after a later change', async () => {
				store.dispatch(watchSession())
				const listener = onIdTokenChanged.mock.calls.at(-1)[1]
				let resolveClaims
				const slowUser = sdkUser({
					getIdTokenResult: () =>
						new Promise((resolve) => (resolveClaims = resolve)),
				})
				firebaseAuth.currentUser = slowUser
				const pending = listener(slowUser)

				await report(null)
				resolveClaims({ claims: {} })
				await pending

				expect(store.getState().authentication.userId).toBeNull()
			})
		})

		describe('restoreSavedSession', () => {
			const API_KEY = 'demo-api-key'
			const KEY = `firebase:authUser:${API_KEY}:[DEFAULT]`
			const encode = (claims) =>
				`header.${btoa(JSON.stringify(claims)).replace(/=+$/, '')}.signature`
			const storageWith = (user) => ({
				getItem: (key) => (key === KEY ? JSON.stringify(user) : null),
			})
			const savedUser = (overrides = {}) => ({
				uid: MOCK_KEYS.LOCAL_ID,
				email: MOCK_KEYS.EMAIL,
				displayName: MOCK_USER.FULL_NAME,
				emailVerified: true,
				stsTokenManager: {
					accessToken: encode({ admin: true }),
					expirationTime: 1,
				},
				...overrides,
			})

			it('starts from the user the SDK saved, still to be confirmed', () => {
				expect(
					restoreSavedSession(storageWith(savedUser()), API_KEY),
				).toEqual({
					userId: MOCK_KEYS.LOCAL_ID,
					userName: MOCK_USER.FULL_NAME,
					userEmail: MOCK_KEYS.EMAIL,
					isAdmin: true,
					emailVerified: true,
					sessionChecked: false,
				})
			})

			it('reads admin from the saved token claims, even an expired one', () => {
				const user = savedUser({
					stsTokenManager: { accessToken: encode({}) },
				})

				expect(
					restoreSavedSession(storageWith(user), API_KEY).isAdmin,
				).toBe(false)
			})

			it('keeps the user, without admin, when the saved token cannot be read', () => {
				const user = savedUser({
					stsTokenManager: { accessToken: 'not-a-token' },
				})

				const session = restoreSavedSession(storageWith(user), API_KEY)
				expect(session.userId).toBe(MOCK_KEYS.LOCAL_ID)
				expect(session.isAdmin).toBe(false)
			})

			it('restores nothing when the SDK saved no user', () => {
				expect(
					restoreSavedSession({ getItem: () => null }, API_KEY),
				).toBeNull()
			})

			it('restores nothing from a user saved for another API key', () => {
				expect(
					restoreSavedSession(storageWith(savedUser()), 'other-key'),
				).toBeNull()
			})

			it('restores nothing from unreadable storage', () => {
				expect(
					restoreSavedSession(
						{
							getItem: () => {
								throw new Error('blocked')
							},
						},
						API_KEY,
					),
				).toBeNull()
			})
		})

		describe('getSessionToken', () => {
			it('waits for the SDK to confirm a saved session before asking for the token', async () => {
				const order = []
				const ready = firebaseAuth.authStateReady
				firebaseAuth.authStateReady = async () => {
					order.push('ready')
				}
				firebaseAuth.currentUser = {
					getIdToken: async () => {
						order.push('token')
						return 'token'
					},
				}

				await getSessionToken()

				expect(order).toEqual(['ready', 'token'])
				firebaseAuth.authStateReady = ready
			})

			it('asks the SDK for the token on each call, so a renewed one is used', async () => {
				const getIdToken = vi
					.fn()
					.mockResolvedValueOnce('first')
					.mockResolvedValueOnce('renewed')
				firebaseAuth.currentUser = { getIdToken }

				expect(await getSessionToken()).toBe('first')
				expect(await getSessionToken()).toBe('renewed')
			})

			it('returns null when no one is signed in', async () => {
				firebaseAuth.currentUser = null

				expect(await getSessionToken()).toBeNull()
			})

			it('throws the request error, not the SDK text, when the token cannot be read', async () => {
				firebaseAuth.currentUser = {
					getIdToken: vi
						.fn()
						.mockRejectedValue(new Error('Firebase: Error')),
				}

				await expect(getSessionToken()).rejects.toThrow(
					ERROR_MESSAGES.REQUEST_ERROR,
				)
			})
		})

		describe('logout', () => {
			it('clears the user and signs out of the SDK, writing nothing to localStorage', async () => {
				await store.dispatch(logout())

				const state = store.getState().authentication

				expect(state.userId).toBeNull()
				expect(state.userName).toBeNull()
				expect(state.userEmail).toBeNull()
				expect(state.isAdmin).toBe(false)
				expect(signOut).toHaveBeenCalledWith(firebaseAuth)
				expect(localStorage.removeItem).not.toHaveBeenCalled()
			})

			it('should handle logout failure and set error state', async () => {
				signOut.mockRejectedValueOnce(
					new Error(MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR),
				)

				const result = await store.dispatch(logout())

				const state = store.getState().authentication
				expect(state.userId).toBeNull()
				expect(state.status).toBe('failed')
				expect(state.error).toBe(
					MOCK_ERROR_MESSAGES.LOCAL_STORAGE_ERROR,
				)
				expect(result.meta.rejectedWithValue).toBe(true)
			})
		})
	})

	describe('sendPasswordReset', () => {
		beforeEach(() => {
			vi.stubGlobal('window', { location: { origin: ORIGIN } })
			return () => vi.unstubAllGlobals()
		})

		it('sends the reset email and resolves with the address', async () => {
			sendPasswordResetEmail.mockResolvedValueOnce()

			const result = await store.dispatch(
				sendPasswordReset(MOCK_KEYS.EMAIL),
			)

			expect(sendPasswordResetEmail).toHaveBeenCalledWith(
				firebaseAuth,
				MOCK_KEYS.EMAIL,
				{ url: `${ORIGIN}${PATHS.AUTHENTICATION}` },
			)
			expect(result.payload).toBe(MOCK_KEYS.EMAIL)
		})

		it('sends the reset email without the Continue link when the domain is not authorised', async () => {
			sendPasswordResetEmail
				.mockRejectedValueOnce({
					code: 'auth/unauthorized-continue-uri',
				})
				.mockResolvedValueOnce()

			const result = await store.dispatch(
				sendPasswordReset(MOCK_KEYS.EMAIL),
			)

			expect(sendPasswordResetEmail).toHaveBeenLastCalledWith(
				firebaseAuth,
				MOCK_KEYS.EMAIL,
			)
			expect(sendPasswordReset.fulfilled.match(result)).toBe(true)
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
		beforeEach(() => {
			vi.stubGlobal('window', { location: { origin: ORIGIN } })
			return () => vi.unstubAllGlobals()
		})

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

			expect(sendEmailVerification).toHaveBeenCalledWith(user, {
				url: `${ORIGIN}${PATHS.REGISTER}`,
			})
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

		it('resends without the Continue link when the domain is not authorised', async () => {
			const user = sessionUser()
			firebaseAuth.currentUser = user
			sendEmailVerification
				.mockRejectedValueOnce({
					code: 'auth/unauthorized-continue-uri',
				})
				.mockResolvedValueOnce()

			const result = await store.dispatch(resendVerification())

			expect(sendEmailVerification).toHaveBeenLastCalledWith(user)
			expect(resendVerification.fulfilled.match(result)).toBe(true)
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
			expect(signOut).toHaveBeenCalledWith(firebaseAuth)
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
