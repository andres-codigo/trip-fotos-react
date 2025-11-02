import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import {
	MOCK_USER,
	MOCK_TRAVELLERS,
	MOCK_TIME,
	MOCK_API_RESPONSES,
} from '@/constants/test'

import { ERROR_MESSAGES } from '@/constants/errors'

import travellersReducer, {
	travellerName,
	setTravellerName,
	selectShouldUpdate,
	updateTravellers,
	loadTravellers,
	setIsTraveller,
	setTravellers,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
	selectTravellerName,
} from './travellersSlice'

import { handleApiError } from '@/utils/errorHandler'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

vi.mock('@/constants/endpoints', () => ({
	API_DATABASE: {
		URL: 'https://mock-api-url.com/',
		KEY: 'mock-api-key',
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
					isTraveller: false,
					hasTravellers: false,
					travellers: [],
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
					const mockError = new Error(ERROR_MESSAGES.NETWORK_ERROR)
					fetch.mockRejectedValueOnce(mockError)

					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					expect(handleApiError).toHaveBeenCalledWith(
						mockError,
						ERROR_MESSAGES.ERROR_UPDATING_TRAVELLER +
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
			it('should return specific error message for 500 status', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
					json: async () => ({ message: 'Internal Server Error' }),
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(ERROR_MESSAGES.SERVER_ERROR)
			})

			it('should return specific error message for 404 status', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 404,
					json: async () => ({ message: 'Not Found' }),
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(ERROR_MESSAGES.DATA_NOT_FOUND)
			})

			it('should return client error message for 400-499 status codes', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 403,
					json: async () => ({ message: 'Forbidden' }),
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(ERROR_MESSAGES.REQUEST_ERROR)
			})

			it('should return connection error message for other status codes', async () => {
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 502,
					json: async () => ({ message: 'Bad Gateway' }),
				})

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(ERROR_MESSAGES.CONNECTION_ERROR)
			})

			it('should handle network errors with specific message', async () => {
				const networkError = new TypeError(
					ERROR_MESSAGES.FAILED_TO_FETCH,
				)
				fetch.mockRejectedValueOnce(networkError)

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(
					ERROR_MESSAGES.NETWORK_CONNECTION_ERROR,
				)
			})

			it('should handle unexpected errors with generic message', async () => {
				const unexpectedError = new Error('Some unexpected error')
				fetch.mockRejectedValueOnce(unexpectedError)

				const result = await store.dispatch(updateTravellers())

				expect(result.payload).toBe(ERROR_MESSAGES.UNEXPECTED_ERROR)
			})
		})
	})

	describe('loadTravellers', () => {
		describe('error scenarios', () => {
			it('should pass through user-friendly error messages', async () => {
				const userFriendlyError = ERROR_MESSAGES.SERVER_ERROR

				// Mock updateTravellers to reject with user-friendly error
				fetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
				})

				const result = await store.dispatch(
					loadTravellers({ forceRefresh: true }),
				)

				expect(result.payload).toBe(userFriendlyError)
			})

			it('should provide fallback message for short/generic errors', async () => {
				// Mock updateTravellers to reject with a short error
				fetch.mockRejectedValueOnce(new Error('Error'))

				const result = await store.dispatch(
					loadTravellers({ forceRefresh: true }),
				)

				expect(result.payload).toBe(ERROR_MESSAGES.UNEXPECTED_ERROR)
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
	})
})
