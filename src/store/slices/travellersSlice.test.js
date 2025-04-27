import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { MOCK } from './constants/mock';

import travellersReducer, {
	travellerName,
	setTravellerName,
} from './travellersSlice';

import { handleApiError } from '@/utils/errorHandler';

vi.mock('@/constants/api', () => ({
	API_DATABASE: {
		API_URL: 'https://mock-api-url.com/',
		API_KEY: 'mock-api-key',
		POST: 'POST',
	},
}));

vi.mock('@/utils/errorHandler', () => ({
	handleApiError: vi.fn((error, message) => `${message}: ${error.message}`),
}));

vi.mock('./authenticationSlice', () => ({
	selectAuthenticationToken: vi.fn(() => MOCK.AUTH_TOKEN),
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
			travellers: travellersReducer,
		},
	});
};

const resetMocks = () => {
	fetch.mockReset();
	localStorage.setItem.mockClear();
	handleApiError.mockClear();
};

beforeEach(() => {
	initializeStore();
	resetMocks();
});

describe('travellersSlice', () => {
	it('should initialize with default state', () => {
		const initialState = store.getState().travellers;
		expect(initialState).toEqual({
			travellerName: '',
			status: 'idle',
			error: null,
		});
	});

	it('should update travellerName when setTravellerName is dispatched', () => {
		const newTravellerName = 'Jane Doe';

		store.dispatch(setTravellerName(newTravellerName));

		const state = store.getState().travellers;
		expect(state.travellerName).toBe(newTravellerName);
	});

	it('should update travellerName and set status to succeeded on successful API call', async () => {
		const mockResponse = { displayName: MOCK.FULL_NAME };
		fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		await store.dispatch(
			travellerName({ first: MOCK.FIRST_NAME, last: MOCK.LAST_NAME }),
		);

		expect(fetch).toHaveBeenCalledWith(
			`${MOCK.API_URL}update?key=${MOCK.API_KEY}`,
			expect.objectContaining({
				method: MOCK.API_METHOD,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					idToken: MOCK.AUTH_TOKEN,
					displayName: MOCK.FULL_NAME,
				}),
			}),
		);

		const state = store.getState().travellers;
		expect(state.travellerName).toBe(MOCK.FULL_NAME);
		expect(state.status).toBe('succeeded');
		expect(localStorage.setItem).toHaveBeenCalledWith(
			'userName',
			MOCK.FULL_NAME,
		);
	});

	it('should set error and reset travellerName on failed API call', async () => {
		fetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'Error' }),
		});

		await store.dispatch(
			travellerName({ first: MOCK.FIRST_NAME, last: MOCK.LAST_NAME }),
		);

		const state = store.getState().travellers;
		expect(state.travellerName).toBe('');
		expect(state.status).toBe('failed');
		expect(state.error).toContain('Failed to update traveller John Doe.');
	});

	it('should call handleApiError on API error', async () => {
		const mockError = new Error('Network Error');
		fetch.mockRejectedValueOnce(mockError);

		await store.dispatch(
			travellerName({ first: MOCK.FIRST_NAME, last: MOCK.LAST_NAME }),
		);

		expect(handleApiError).toHaveBeenCalledWith(
			mockError,
			'An error occurred while updating traveller John Doe',
		);
	});
});
