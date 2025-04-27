import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { API_DATABASE } from '@/constants/api';

import authenticationReducer, {
	login,
	tryLogin,
	logout,
	autoLogout,
	authActions,
} from './authenticationSlice';

const MOCK_API_URL = 'https://mock-api-url.com/';
const MOCK_API_KEY = 'mock-api-key';

vi.mock('@/constants/api', () => ({
	API_DATABASE: {
		API_URL: 'https://mock-api-url.com/',
		API_KEY: 'mock-api-key',
		POST: 'POST',
		API_AUTH_LOGIN_MODE: 'login',
		API_AUTH_SIGNUP_MODE: 'signup',
	},
}));

global.fetch = vi.fn();

Object.defineProperty(global, 'localStorage', {
	value: {
		setItem: vi.fn(),
		getItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
});

let store;

const initializeStore = () => {
	store = configureStore({
		reducer: {
			authentication: authenticationReducer,
		},
	});
};

const resetMocks = () => {
	fetch.mockReset();
	localStorage.setItem.mockClear();
	localStorage.getItem.mockClear();
	localStorage.removeItem.mockClear();
};

describe('authenticationSlice', () => {
	beforeEach(() => {
		initializeStore();
		resetMocks();
	});

	describe('reducers', () => {
		it('should return the initial state', () => {
			const initialState = {
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				didAutoLogout: false,
			};

			const state = authenticationReducer(undefined, { type: undefined });
			expect(state).toEqual(initialState);
		});

		it('should handle clearUser', () => {
			const previousState = {
				token: 'mock-token',
				userId: 'mock-user-id',
				userName: 'mock-user-name',
				userEmail: 'mock-user-email',
				didAutoLogout: false,
			};

			const state = authenticationReducer(
				previousState,
				authActions.clearUser(),
			);
			expect(state).toEqual({
				token: null,
				userId: null,
				userName: null,
				userEmail: null,
				didAutoLogout: false,
			});
		});

		it('should handle setAutoLogout', () => {
			const previousState = {
				token: 'mock-token',
				userId: 'mock-user-id',
				userName: 'mock-user-name',
				userEmail: 'mock-user-email',
				didAutoLogout: false,
			};

			const state = authenticationReducer(
				previousState,
				authActions.setAutoLogout(),
			);
			expect(state).toEqual({
				token: 'mock-token',
				userId: 'mock-user-id',
				userName: 'mock-user-name',
				userEmail: 'mock-user-email',
				didAutoLogout: true,
			});
		});
	});

	describe('actions', () => {
		const STORAGE_KEYS = {
			TOKEN: 'token',
			USER_ID: 'userId',
			USER_NAME: 'userName',
			USER_EMAIL: 'userEmail',
			TOKEN_EXPIRATION: 'tokenExpiration',
		};

		const MOCK_KEYS = {
			EMAIL: 'test@example.com',
			PASSWORD: 'password123',
			ID_TOKEN: 'mock-id-token',
			LOCAL_ID: 'mock-local-id',
			EXPIRATION: new Date().getTime() + 3600 * 1000,
		};

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
		];

		describe('login', () => {
			describe.each(loginTestCases)(
				'success scenarios',
				({ description, displayName, mode }) => {
					it(`should handle login success when displayName is ${description} and mode is ${mode}`, async () => {
						const mockResponse = {
							idToken: MOCK_KEYS.ID_TOKEN,
							localId: MOCK_KEYS.LOCAL_ID,
							displayName: displayName,
							email: MOCK_KEYS.EMAIL,
							expiresIn: '3600',
						};

						fetch.mockResolvedValueOnce({
							ok: true,
							json: async () => mockResponse,
						});

						await store.dispatch(
							login({
								mode,
								email: MOCK_KEYS.EMAIL,
								password: MOCK_KEYS.PASSWORD,
							}),
						);

						const expectedUrl =
							mode === API_DATABASE.API_AUTH_SIGNUP_MODE
								? `${MOCK_API_URL}signUp?key=${MOCK_API_KEY}`
								: `${MOCK_API_URL}signInWithPassword?key=${MOCK_API_KEY}`;

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
						);

						const state = store.getState().authentication;
						expect(state.token).toBe(MOCK_KEYS.ID_TOKEN);
						expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID);
						expect(state.userName).toBe(displayName);
						expect(state.userEmail).toBe(MOCK_KEYS.EMAIL);

						expect(localStorage.setItem).toHaveBeenCalledWith(
							STORAGE_KEYS.TOKEN,
							MOCK_KEYS.ID_TOKEN,
						);
						expect(localStorage.setItem).toHaveBeenCalledWith(
							STORAGE_KEYS.USER_ID,
							MOCK_KEYS.LOCAL_ID,
						);
						expect(localStorage.setItem).toHaveBeenCalledWith(
							STORAGE_KEYS.USER_NAME,
							displayName,
						);
						expect(localStorage.setItem).toHaveBeenCalledWith(
							STORAGE_KEYS.USER_EMAIL,
							MOCK_KEYS.EMAIL,
						);
					});
				},
			);

			describe('failure scenarios', () => {
				it('should handle login failure and return error message', async () => {
					const mockErrorMessage = 'INVALID_PASSWORD';
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => ({
							error: { message: mockErrorMessage },
						}),
					});

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.API_AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					);

					expect(fetch).toHaveBeenCalledWith(
						`${MOCK_API_URL}signInWithPassword?key=${MOCK_API_KEY}`,
						expect.objectContaining({
							method: API_DATABASE.POST,
							body: JSON.stringify({
								email: MOCK_KEYS.EMAIL,
								password: MOCK_KEYS.PASSWORD,
								returnSecureToken: true,
							}),
						}),
					);

					const state = store.getState().authentication;
					expect(state.token).toBeNull();
					expect(state.userId).toBeNull();
					expect(state.userName).toBeNull();
					expect(state.userEmail).toBeNull();

					expect(result.payload).toBe(mockErrorMessage);
					expect(result.meta.rejectedWithValue).toBe(true);
				});

				it('should handle network errors', async () => {
					const mockError = new Error('Network Error');
					fetch.mockRejectedValueOnce(mockError);

					const result = await store.dispatch(
						login({
							mode: API_DATABASE.API_AUTH_LOGIN_MODE,
							email: MOCK_KEYS.EMAIL,
							password: MOCK_KEYS.PASSWORD,
						}),
					);

					expect(fetch).toHaveBeenCalledWith(
						`${MOCK_API_URL}signInWithPassword?key=${MOCK_API_KEY}`,
						expect.objectContaining({
							method: API_DATABASE.POST,
							body: JSON.stringify({
								email: MOCK_KEYS.EMAIL,
								password: MOCK_KEYS.PASSWORD,
								returnSecureToken: true,
							}),
						}),
					);

					const state = store.getState().authentication;
					expect(state.token).toBeNull();
					expect(state.userId).toBeNull();
					expect(state.userName).toBeNull();
					expect(state.userEmail).toBeNull();

					expect(result.payload).toBe(mockError.message);
					expect(result.meta.rejectedWithValue).toBe(true);
				});
			});
		});

		const tryLoginTestCases = [
			{
				description: 'empty string',
				displayName: '',
			},
			{
				description: 'non-empty string',
				displayName: 'Test User',
			},
		];

		describe('tryLogin', () => {
			describe.each(tryLoginTestCases)(
				'success scenarios',
				({ description, displayName }) => {
					it(`should restore user details from localStorage when displayName is ${description}`, async () => {
						localStorage.getItem.mockImplementation((key) => {
							switch (key) {
								case STORAGE_KEYS.TOKEN:
									return MOCK_KEYS.ID_TOKEN;
								case STORAGE_KEYS.USER_ID:
									return MOCK_KEYS.LOCAL_ID;
								case STORAGE_KEYS.USER_NAME:
									return displayName;
								case STORAGE_KEYS.USER_EMAIL:
									return MOCK_KEYS.EMAIL;
								case STORAGE_KEYS.TOKEN_EXPIRATION:
									return MOCK_KEYS.EXPIRATION.toString();
								default:
									return null;
							}
						});

						await store.dispatch(tryLogin());

						const state = store.getState().authentication;

						expect(state.token).toBe(MOCK_KEYS.ID_TOKEN);
						expect(state.userId).toBe(MOCK_KEYS.LOCAL_ID);
						expect(state.userName).toBe(displayName);
						expect(state.userEmail).toBe(MOCK_KEYS.EMAIL);
					});
				},
			);

			it('should handle expired token', async () => {
				localStorage.getItem.mockImplementation((key) => {
					switch (key) {
						case STORAGE_KEYS.TOKEN_EXPIRATION:
							return (new Date().getTime() - 1000).toString();
						default:
							return null;
					}
				});

				await store.dispatch(tryLogin());

				const state = store.getState().authentication;

				expect(state.token).toBeNull();
				expect(state.userId).toBeNull();
				expect(state.userName).toBeNull();
				expect(state.userEmail).toBeNull();
			});

			it('should handle empty localStorage during tryLogin', async () => {
				localStorage.getItem.mockImplementation(() => null);

				await store.dispatch(tryLogin());

				const state = store.getState().authentication;

				expect(state.token).toBeNull();
				expect(state.userId).toBeNull();
				expect(state.userName).toBeNull();
				expect(state.userEmail).toBeNull();
				expect(state.didAutoLogout).toBe(false);
			});

			it('should clear user details and set didAutoLogout to true', async () => {
				await store.dispatch(autoLogout());

				const state = store.getState().authentication;

				expect(state.token).toBeNull();
				expect(state.userId).toBeNull();
				expect(state.userName).toBeNull();
				expect(state.userEmail).toBeNull();
				expect(state.didAutoLogout).toBe(true);
			});
		});

		describe('logout', () => {
			it('should clear user details and localStorage', async () => {
				await store.dispatch(logout());

				const state = store.getState().authentication;

				expect(state.token).toBeNull();
				expect(state.userId).toBeNull();
				expect(state.userName).toBeNull();
				expect(state.userEmail).toBeNull();

				expect(localStorage.removeItem).toHaveBeenCalledWith(
					STORAGE_KEYS.TOKEN,
				);
				expect(localStorage.removeItem).toHaveBeenCalledWith(
					STORAGE_KEYS.USER_ID,
				);
				expect(localStorage.removeItem).toHaveBeenCalledWith(
					STORAGE_KEYS.USER_NAME,
				);
				expect(localStorage.removeItem).toHaveBeenCalledWith(
					STORAGE_KEYS.USER_EMAIL,
				);
				expect(localStorage.removeItem).toHaveBeenCalledWith(
					STORAGE_KEYS.TOKEN_EXPIRATION,
				);
			});
		});

		describe('autoLogout', () => {
			it('should clear user details and set didAutoLogout to true', async () => {
				await store.dispatch(autoLogout());

				const state = store.getState().authentication;

				expect(state.token).toBeNull();
				expect(state.userId).toBeNull();
				expect(state.userName).toBeNull();
				expect(state.userEmail).toBeNull();
				expect(state.didAutoLogout).toBe(true);
			});
		});
	});
});
