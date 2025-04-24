import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authenticationReducer, { login } from './authenticationSlice';
import { API_DATABASE } from '@/constants/api';

const MOCK_API_URL = 'https://mock-api-url.com/';
const MOCK_API_KEY = 'mock-api-key';
const MOCK_EMAIL = 'test@example.com';
const MOCK_PASSWORD = 'password123';
const MOCK_ID_TOKEN = 'mock-id-token';
const MOCK_LOCAL_ID = 'mock-local-id';

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

describe('authenticationSlice actions', () => {
	describe.each([
		['empty string', ''],
		['non-empty string', 'Test User'],
	])(
		'login success with displayName as either empty or non-empty string',
		(description, displayName) => {
			it('should store token and user details on successful login', async () => {
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

	describe('login failure', () => {
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
});
