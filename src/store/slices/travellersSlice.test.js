import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import {
	MOCK_USER,
	MOCK_TRAVELLERS,
	MOCK_TIME,
	MOCK_API_RESPONSES,
} from '@/constants/test'

import { ERROR_MESSAGES } from '@/constants/errors'
import { API_ERROR_MESSAGE } from '@/constants/api'

import travellersReducer, {
	registerTraveller,
	travellerName,
	setTravellerName,
	selectShouldUpdate,
	updateTravellers,
	loadTraveller,
	loadTravellers,
	setIsTraveller,
	setTravellers,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
	selectTravellerName,
	selectSelectedTraveller,
} from './travellersSlice'

import { handleApiError } from '@/utils/errorHandler'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
	getStorage: vi.fn(),
	ref: vi.fn(),
	uploadBytesResumable: vi.fn(() => ({
		on: vi.fn((event, progress, error, complete) => {
			complete()
		}),
		snapshot: { ref: 'mock-ref' },
	})),
	getDownloadURL: vi.fn(() =>
		Promise.resolve('https://mock-url.com/image.jpg'),
	),
}))

// Mock image compression
vi.mock('browser-image-compression', () => ({
	default: vi.fn((file) => Promise.resolve(file)),
}))

/**
 * travellersSlice Unit Tests
 *
 * Tests Redux slice managing traveller data including fetching, caching, and state updates.
 *
 * Mocks:
 * - API_DATABASE: Mock endpoint configuration for API calls
 * - errorHandler: Mock error handling utility
 * - authenticationSlice: Mock token selector for authenticated requests
 * - global.fetch: Mock fetch API for simulating network requests
 * - localStorage: Mock storage for user data persistence
 *
 * Slice Features:
 * - Async thunks: travellerName, updateTravellers, loadTravellers
 * - Synchronous actions: setTravellerName, setIsTraveller, setTravellers
 * - Selectors: Select traveller data, validation flags, and cache state
 * - Cache management: 60-second cache with force refresh option
 *
 * Test Coverage:
 * - Initial state verification
 * - Synchronous action reducers
 * - Async thunk success and failure scenarios
 * - API error handling (network, server, client errors)
 * - Cache logic (shouldUpdate helper)
 * - Data transformation and user prioritization
 * - Selectors for state access
 */

vi.mock('@/constants/endpoints', () => ({
	API_DATABASE: {
		URL: 'https://mock-api-url.com/',
		KEY: 'mock-api-key',
		POST: 'POST',
	},
}))

vi.mock('@/utils/errorHandler', () => ({
	handleApiError: vi.fn((error, message) => {
		// Handle cases where error is just a string (e.g. from rejectWithValue)
		const errorMessage = error?.message || error
		return `${message}: ${errorMessage}`
	}),
}))

vi.mock('./authenticationSlice', () => ({
	selectAuthenticationToken: vi.fn(() => MOCK_USER.TOKEN),
}))

let store

const initialiseStore = () => {
	store = configureStore({
		reducer: {
			travellers: travellersReducer,
		},
	})
}

beforeEach(() => {
	initialiseStore()
	vi.clearAllMocks()
	// Re-establish fetch as a mock after clearing
	if (!vi.isMockFunction(global.fetch)) {
		global.fetch = vi.fn()
	}
})

setupMocks()

describe('travellersSlice', () => {
	describe('initial state', () => {
		describe('success scenarios', () => {
			it('should initialise with default state', () => {
				const initialState = store.getState().travellers
				expect(initialState).toEqual({
					travellerName: '',
					isTraveller: false,
					hasTravellers: false,
					travellers: [],
					selectedTraveller: null,
					lastFetch: null,
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
					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () =>
							MOCK_API_RESPONSES.DISPLAY_NAME_SUCCESS,
					})

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					const state = store.getState().travellers
					expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)
					expect(state.status).toBe('succeeded')
				})
			})

			describe('failure scenarios', () => {
				it('should set error and reset travellerName on failed API call', async () => {
					fetch.mockResolvedValueOnce({
						ok: false,
						json: async () => MOCK_API_RESPONSES.GENERIC_ERROR,
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
				})

				it('should call handleApiError on API error', async () => {
					const mockError = new Error(API_ERROR_MESSAGE.NETWORK_ERROR)
					fetch.mockRejectedValueOnce(mockError)

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					expect(handleApiError).toHaveBeenCalledWith(
						mockError,
						API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME_CATCH +
							MOCK_USER.FULL_NAME,
					)
				})
			})
		})
	})

	describe('shouldUpdate helper function', () => {
		it('should return true when lastFetch is null', () => {
			const state = { lastFetch: null }
			// Since shouldUpdate is not exported, we test it through selectShouldUpdate
			const mockState = { travellers: state }
			const result = selectShouldUpdate(mockState)
			expect(result).toBe(true)
		})

		it('should return true when more than 60 seconds have passed', () => {
			const oldTimestamp =
				new Date().getTime() - MOCK_TIME.SEVENTY_SECONDS_AGO
			const state = { lastFetch: oldTimestamp }
			const mockState = { travellers: state }
			const result = selectShouldUpdate(mockState)
			expect(result).toBe(true)
		})

		it('should return false when less than 60 seconds have passed', () => {
			const recentTimestamp =
				new Date().getTime() - MOCK_TIME.THIRTY_SECONDS_AGO
			const state = { lastFetch: recentTimestamp }
			const mockState = { travellers: state }
			const result = selectShouldUpdate(mockState)
			expect(result).toBe(false)
		})
	})

	describe('updateTravellers', () => {
		describe('success scenarios', () => {
			it('should fetch and transform travellers data successfully', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => MOCK_API_RESPONSES.TRAVELLERS_RESPONSE,
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toEqual([
					MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE,
				])
			})

			it('should unshift logged-in traveller and dispatch setTravellerName', async () => {
				const userId = 'user1'
				const loggedInTraveller = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE
				const otherTraveller = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO
				const responseData = {
					[userId]: loggedInTraveller,
					['user2']: otherTraveller,
				}
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => responseData,
				})

				const originalGetItem = global.localStorage.getItem
				global.localStorage.getItem = vi.fn((key) => {
					if (key === 'userId') return userId
					return null
				})

				const result = await store.dispatch(updateTravellers())
				expect(result.payload[0]).toEqual(loggedInTraveller)

				const state = store.getState().travellers
				expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)

				global.localStorage.getItem = originalGetItem
			})

			it('should return empty array when response is null', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toEqual([])
			})

			it('should return empty array when response is empty object', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({}),
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toEqual([])
			})
		})

		describe('error scenarios', () => {
			it('should handle network errors with specific message', async () => {
				const networkError = new TypeError(
					API_ERROR_MESSAGE.FAILED_TO_FETCH,
				)
				fetch.mockRejectedValueOnce(networkError)

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(
					ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
				)
			})

			it('should handle unexpected errors with generic message', async () => {
				const unexpectedError = new Error(
					`${API_ERROR_MESSAGE.FAILED_TO_FETCH}`,
				)
				fetch.mockRejectedValueOnce(unexpectedError)

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(
					ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
				)
			})
		})
	})

	describe('registerTraveller', () => {
		const mockRegistrationData = {
			firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
			lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
			description: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.description,
			daysInCity: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity,
			cities: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.cities,
			files: [{ name: 'test.jpg', file: new Blob() }],
		}

		beforeEach(() => {
			localStorage.getItem.mockReturnValue(MOCK_USER.USER_ID)
		})

		afterEach(() => {
			localStorage.getItem.mockReset()
		})

		describe('success scenarios', () => {
			it('should upload images and register traveller successfully', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				// Verify successful registration
				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toMatchObject({
					id: MOCK_USER.USER_ID,
					firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
					lastName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName,
					description:
						MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.description,
					daysInCity: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.daysInCity,
					cities: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.cities,
					files: ['https://mock-url.com/image.jpg'],
				})

				// Verify state updates
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(true)
				expect(state.hasTravellers).toBe(true)
				expect(state.travellerName).toBe(
					`${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName} ${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName}`,
				)
				expect(state.travellers).toContainEqual(
					expect.objectContaining({
						id: MOCK_USER.USER_ID,
						firstName:
							MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
					}),
				)
			})
		})

		describe('failure scenarios', () => {
			it('should return error message when API response is not ok', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
				})

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalledWith(
					expect.any(Error),
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${MOCK_USER.USER_ID}.`,
				)

				const state = store.getState().travellers
				expect(state.status).toBe('failed')
				expect(state.isTraveller).toBe(false)
				expect(state.travellers).toEqual([])
			})

			it('should call handleApiError on network error', async () => {
				const mockError = new Error(API_ERROR_MESSAGE.NETWORK_ERROR)
				fetch.mockRejectedValueOnce(mockError)

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalledWith(
					mockError,
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${MOCK_USER.USER_ID}.`,
				)

				const state = store.getState().travellers
				expect(state.status).toBe('failed')
				expect(state.isTraveller).toBe(false)
				expect(state.travellers).toEqual([])
			})
		})
	})

	describe('loadTraveller', () => {
		const mockId = 'user123'
		const mockTravellerData = MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE

		describe('success scenarios', () => {
			it('should fetch and set selected traveller', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTravellerData,
				})

				const result = await store.dispatch(loadTraveller(mockId))

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toEqual({
					...mockTravellerData,
					id: mockId,
				})

				const state = store.getState().travellers
				expect(state.selectedTraveller).toEqual({
					...mockTravellerData,
					id: mockId,
				})
				expect(state.status).toBe('succeeded')
			})
		})

		describe('failure scenarios', () => {
			it('should handle API error (not ok)', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 404, // Simulate Not Found
				})

				const result = await store.dispatch(loadTraveller(mockId))

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()

				const state = store.getState().travellers
				expect(state.status).toBe('failed')
				expect(state.error).toContain(
					`${API_ERROR_MESSAGE.LOAD_TRAVELLER_CATCH}${mockId}`,
				)
			})

			it('should handle missing data (valid 200 OK but null body)', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})

				const result = await store.dispatch(loadTraveller(mockId))

				expect(result.meta.requestStatus).toBe('rejected')
				const state = store.getState().travellers
				expect(state.status).toBe('failed')
			})

			it('should handle network errors', async () => {
				const networkError = new Error('Network Error')
				fetch.mockRejectedValueOnce(networkError)

				const result = await store.dispatch(loadTraveller(mockId))

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('loadTravellers', () => {
		describe('success scenarios', () => {
			it('should return cached travellers when shouldUpdate returns false', async () => {
				const recentTimestamp =
					new Date().getTime() - MOCK_TIME.THIRTY_SECONDS_AGO
				const cachedTravellers = [MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE]

				store = configureStore({
					reducer: {
						travellers: travellersReducer,
					},
					preloadedState: {
						travellers: {
							travellerName: '',
							isTraveller: false,
							hasTravellers: true,
							travellers: cachedTravellers,
							lastFetch: recentTimestamp,
							status: 'idle',
							error: null,
						},
					},
				})

				const fetchSpy = vi.spyOn(global, 'fetch')

				const result = await store.dispatch(
					loadTravellers({ forceRefresh: false }),
				)

				expect(result.payload).toEqual(cachedTravellers)
				expect(fetchSpy).not.toHaveBeenCalled()

				fetchSpy.mockRestore()
			})

			it('should fetch fresh data when forceRefresh is true', async () => {
				const recentTimestamp =
					new Date().getTime() - MOCK_TIME.THIRTY_SECONDS_AGO
				const cachedTravellers = [MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE]

				const testStore = configureStore({
					reducer: {
						travellers: travellersReducer,
					},
					preloadedState: {
						travellers: {
							travellerName: '',
							isTraveller: false,
							hasTravellers: true,
							travellers: cachedTravellers,
							lastFetch: recentTimestamp,
							status: 'idle',
							error: null,
						},
					},
				})

				const freshTravellers = [MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO]
				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						user2: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO,
					}),
				})

				const result = await testStore.dispatch(
					loadTravellers({ forceRefresh: true }),
				)

				expect(result.payload).toEqual(freshTravellers)
				expect(global.fetch).toHaveBeenCalled()
			})

			it('should update lastFetch timestamp after successful fetch', async () => {
				const beforeFetch = new Date().getTime()

				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => MOCK_API_RESPONSES.TRAVELLERS_RESPONSE,
				})

				await store.dispatch(loadTravellers({ forceRefresh: true }))

				const afterFetch = new Date().getTime()
				const state = store.getState().travellers

				expect(state.lastFetch).toBeGreaterThanOrEqual(beforeFetch)
				expect(state.lastFetch).toBeLessThanOrEqual(afterFetch)
			})
		})

		describe('error scenarios', () => {
			it('should pass through user-friendly error messages', async () => {
				global.fetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
				})

				const result = await store.dispatch(
					loadTravellers({ forceRefresh: true }),
				)

				expect(result.payload).toBe(
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLERS_CATCH}: ${ERROR_MESSAGES.REQUEST_ERROR}`,
				)
			})

			it('should provide fallback message for short/generic errors', async () => {
				global.fetch.mockRejectedValueOnce(
					new Error(API_ERROR_MESSAGE.NETWORK_ERROR),
				)

				const result = await store.dispatch(
					loadTravellers({ forceRefresh: true }),
				)

				expect(result.payload).toBe(
					ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
				)
			})
		})
	})

	describe('reducer actions', () => {
		describe('setIsTraveller', () => {
			it('should set isTraveller to true', () => {
				store.dispatch(setIsTraveller(true))
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(true)
			})

			it('should set isTraveller to false', () => {
				store.dispatch(setIsTraveller(false))
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(false)
			})
		})

		describe('setTravellers', () => {
			it('should set travellers array and hasTravellers to true when array has items', () => {
				const mockTravellers = [MOCK_TRAVELLERS.TEST_TRAVELLER]
				store.dispatch(setTravellers(mockTravellers))

				const state = store.getState().travellers
				expect(state.travellers).toEqual(mockTravellers)
				expect(state.hasTravellers).toBe(true)
			})

			it('should set travellers array and hasTravellers to false when array is empty', () => {
				store.dispatch(setTravellers([]))

				const state = store.getState().travellers
				expect(state.travellers).toEqual([])
				expect(state.hasTravellers).toBe(false)
			})
		})
	})

	describe('selectors', () => {
		beforeEach(() => {
			store.dispatch(setTravellers([MOCK_TRAVELLERS.TEST_TRAVELLER]))
			store.dispatch(setIsTraveller(true))
			store.dispatch(setTravellerName(MOCK_TRAVELLERS.TEST_NAME))
		})

		it('should return travellers array from state', () => {
			const result = selectTravellers(store.getState())
			expect(result).toEqual([MOCK_TRAVELLERS.TEST_TRAVELLER])
		})

		it('should return hasTravellers boolean from state', () => {
			const result = selectHasTravellers(store.getState())
			expect(result).toBe(true)
		})

		it('should return isTraveller boolean from state', () => {
			const result = selectIsTraveller(store.getState())
			expect(result).toBe(true)
		})

		it('should return travellerName string from state', () => {
			const result = selectTravellerName(store.getState())
			expect(result).toBe(MOCK_TRAVELLERS.TEST_NAME)
		})

		it('should return selectedTraveller from state', () => {
			// Manually set selectedTraveller state
			const mockState = {
				travellers: {
					selectedTraveller: MOCK_TRAVELLERS.TEST_TRAVELLER,
				},
			}
			const result = selectSelectedTraveller(mockState)
			expect(result).toEqual(MOCK_TRAVELLERS.TEST_TRAVELLER)
		})
	})
})
