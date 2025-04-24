import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer, {
	login,
	tryLogin,
	logout,
	autoLogout,
	authActions,
} from './authenticationSlice';
import { API_DATABASE } from '@/constants/api';

const MOCK_API_URL = 'https://mock-api-url.com/';
const MOCK_API_KEY = 'mock-api-key';
const MOCK_EMAIL = 'test@example.com';
const MOCK_PASSWORD = 'password123';
const MOCK_ID_TOKEN = 'mock-id-token';
const MOCK_LOCAL_ID = 'mock-local-id';
const MOCK_EXPIRATION = new Date().getTime() + 3600 * 1000;

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

beforeEach(() => {
	initializeStore();
	resetMocks();
});

describe('authenticationSlice reducers', () => {
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
});

describe('authenticationSlice actions', () => {
	describe.each([
		['empty string', '', API_DATABASE.API_AUTH_LOGIN_MODE],
		['non-empty string', 'Test User', API_DATABASE.API_AUTH_LOGIN_MODE],
		['empty string (signup)', '', API_DATABASE.API_AUTH_SIGNUP_MODE],
		[
			'non-empty string (signup)',
			'Test User',
			API_DATABASE.API_AUTH_SIGNUP_MODE,
		],
	])(
		'login success with displayName as %s and mode as %s action',
		(description, displayName, mode) => {
			it(`should store token and user details when displayName is ${description} and mode is ${mode}`, async () => {
				const mockResponse = {
					idToken: MOCK_ID_TOKEN,
					localId: MOCK_LOCAL_ID,
					displayName: displayName,
					email: MOCK_EMAIL,
					expiresIn: '3600',
				};

				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockResponse,
				});

				await store.dispatch(
					login({
						mode,
						email: MOCK_EMAIL,
						password: MOCK_PASSWORD,
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
							email: MOCK_EMAIL,
							password: MOCK_PASSWORD,
							returnSecureToken: true,
						}),
					}),
				);

				const state = store.getState().authentication;
				expect(state.token).toBe(MOCK_ID_TOKEN);
				expect(state.userId).toBe(MOCK_LOCAL_ID);
				expect(state.userName).toBe(displayName);
				expect(state.userEmail).toBe(MOCK_EMAIL);

				expect(localStorage.setItem).toHaveBeenCalledWith(
					'token',
					MOCK_ID_TOKEN,
				);
				expect(localStorage.setItem).toHaveBeenCalledWith(
					'userId',
					MOCK_LOCAL_ID,
				);
				expect(localStorage.setItem).toHaveBeenCalledWith(
					'userName',
					displayName,
				);
				expect(localStorage.setItem).toHaveBeenCalledWith(
					'userEmail',
					MOCK_EMAIL,
				);
			});
		},
	);

	describe('login failure action', () => {
		it('should handle login failure and return error message', async () => {
			const mockErrorMessage = 'INVALID_PASSWORD';
			fetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: { message: mockErrorMessage } }),
			});

			const result = await store.dispatch(
				login({
					mode: API_DATABASE.API_AUTH_LOGIN_MODE,
					email: MOCK_EMAIL,
					password: MOCK_PASSWORD,
				}),
			);

			expect(fetch).toHaveBeenCalledWith(
				`${MOCK_API_URL}signInWithPassword?key=${MOCK_API_KEY}`,
				expect.objectContaining({
					method: API_DATABASE.POST,
					body: JSON.stringify({
						email: MOCK_EMAIL,
						password: MOCK_PASSWORD,
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

		it('should handle network errors gracefully', async () => {
			const mockError = new Error('Network Error');
			fetch.mockRejectedValueOnce(mockError);

			const result = await store.dispatch(
				login({
					mode: API_DATABASE.API_AUTH_LOGIN_MODE,
					email: MOCK_EMAIL,
					password: MOCK_PASSWORD,
				}),
			);

			expect(fetch).toHaveBeenCalledWith(
				`${MOCK_API_URL}signInWithPassword?key=${MOCK_API_KEY}`,
				expect.objectContaining({
					method: API_DATABASE.POST,
					body: JSON.stringify({
						email: MOCK_EMAIL,
						password: MOCK_PASSWORD,
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

	describe('tryLogin action', () => {
		describe.each([
			['empty string', ''],
			['non-empty string', 'Test User'],
		])(
			'tryLogin success with displayName as %s action',
			(description, displayName) => {
				it(`should handle tryLogin successfully when displayName is ${description}`, async () => {
					localStorage.getItem.mockImplementation((key) => {
						switch (key) {
							case 'token':
								return MOCK_ID_TOKEN;
							case 'userId':
								return MOCK_LOCAL_ID;
							case 'userName':
								return displayName;
							case 'userEmail':
								return MOCK_EMAIL;
							case 'tokenExpiration':
								return MOCK_EXPIRATION.toString();
							default:
								return null;
						}
					});

					await store.dispatch(tryLogin());

					const state = store.getState().authentication;

					expect(state.token).toBe(MOCK_ID_TOKEN);
					expect(state.userId).toBe(MOCK_LOCAL_ID);
					expect(state.userName).toBe(displayName);
					expect(state.userEmail).toBe(MOCK_EMAIL);
				});
			},
		);

		it('should handle tryLogin with expired token', async () => {
			localStorage.getItem.mockImplementation((key) => {
				switch (key) {
					case 'tokenExpiration':
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
	});

	describe('logout and autoLogout actions', () => {
		it('should handle logout', async () => {
			await store.dispatch(logout());

			const state = store.getState().authentication;

			expect(state.token).toBeNull();
			expect(state.userId).toBeNull();
			expect(state.userName).toBeNull();
			expect(state.userEmail).toBeNull();

			expect(localStorage.removeItem).toHaveBeenCalledWith('token');
			expect(localStorage.removeItem).toHaveBeenCalledWith('userId');
			expect(localStorage.removeItem).toHaveBeenCalledWith('userName');
			expect(localStorage.removeItem).toHaveBeenCalledWith('userEmail');
			expect(localStorage.removeItem).toHaveBeenCalledWith(
				'tokenExpiration',
			);
		});

		it('should handle autoLogout', async () => {
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
