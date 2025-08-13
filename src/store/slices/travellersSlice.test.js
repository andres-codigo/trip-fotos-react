import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import {
	MOCK_API,
	MOCK_USER,
	MOCK_STORAGE_KEYS,
	MOCK_MESSAGES,
} from '@/constants/mock-data'

import travellersReducer, {
	travellerName,
	setTravellerName,
} from './travellersSlice'

import { handleApiError } from '@/utils/errorHandler'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

vi.mock('@/constants/api', () => ({
	API_DATABASE: {
		API_URL: 'https://mock-api-url.com/',
		API_KEY: 'mock-api-key',
		POST: 'POST',
	},
}))

vi.mock('@/utils/errorHandler', () => ({
	handleApiError: vi.fn((error, message) => `${message}: ${error.message}`),
}))

vi.mock('./authenticationSlice', () => ({
	selectAuthenticationToken: vi.fn(() => MOCK_USER.TOKEN),
}))

let store

const initializeStore = () => {
	store = configureStore({
		reducer: {
			travellers: travellersReducer,
		},
	})
}

beforeEach(() => {
	initializeStore()
})

setupMocks()

describe('travellersSlice', () => {
	describe('initial state', () => {
		describe('success scenarios', () => {
			it('should initialize with default state', () => {
				const initialState = store.getState().travellers
				expect(initialState).toEqual({
					travellerName: '',
					status: 'idle',
					error: null,
				})
			})
		})
	})

	describe('actions', () => {
		describe('travellerName', () => {
			describe('success scenarios', () => {
				it('should update travellerName when setTravellerName is dispatched', () => {
					store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))

					const state = store.getState().travellers
					expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)
				})

				it('should update travellerName and set status to succeeded on successful API call', async () => {
					const mockResponse = { displayName: MOCK_USER.FULL_NAME }
					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () => mockResponse,
					})

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					expect(fetch).toHaveBeenCalledWith(
						`${MOCK_API.URL}update?key=${MOCK_API.KEY}`,
						expect.objectContaining({
							method: MOCK_API.METHOD,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								idToken: MOCK_USER.TOKEN,
								displayName: MOCK_USER.FULL_NAME,
							}),
						}),
					)

					const state = store.getState().travellers
					expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)
					expect(state.status).toBe('succeeded')
					expect(localStorage.setItem).toHaveBeenCalledWith(
						MOCK_STORAGE_KEYS.USER_NAME,
						MOCK_USER.FULL_NAME,
					)
				})
			})

			describe('failure scenarios', () => {
				it('should set error and reset travellerName on failed API call', async () => {
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => ({ error: 'Error' }),
					})

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					const state = store.getState().travellers
					expect(state.travellerName).toBe('')
					expect(state.status).toBe('failed')
					expect(state.error).toContain(
						MOCK_MESSAGES.FAILED_TO_UPDATE_TRAVELLER +
							MOCK_USER.FULL_NAME,
					)
				})

				it('should call handleApiError on API error', async () => {
					const mockError = new Error(MOCK_MESSAGES.NETWORK_ERROR)
					fetch.mockRejectedValueOnce(mockError)

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					expect(handleApiError).toHaveBeenCalledWith(
						mockError,
						MOCK_MESSAGES.ERROR_UPDATING_TRAVELLER +
							MOCK_USER.FULL_NAME,
					)
				})
			})
		})
	})
})
