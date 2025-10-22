import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import {
	MOCK_USER,
	MOCK_MESSAGES,
	MOCK_STATUS,
	MOCK_STATE_VALUES,
	MOCK_TRAVELLERS,
	MOCK_TIME,
	MOCK_API_RESPONSES,
} from '@/constants/test/mock-data'

import travellersReducer, {
	travellerName,
	setTravellerName,
	selectShouldUpdate,
	updateTravellers,
	setIsTraveller,
	setTravellers,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
	selectTravellerName,
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
					travellerName: MOCK_STATE_VALUES.EMPTY_STRING,
					isTraveller: MOCK_STATE_VALUES.FALSE,
					hasTravellers: MOCK_STATE_VALUES.FALSE,
					travellers: MOCK_STATE_VALUES.EMPTY_ARRAY,
					lastFetch: MOCK_STATE_VALUES.NULL,
					status: MOCK_STATUS.IDLE,
					error: MOCK_STATE_VALUES.NULL,
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
					expect(state.status).toBe(MOCK_STATUS.SUCCEEDED)
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
					expect(state.travellerName).toBe(
						MOCK_STATE_VALUES.EMPTY_STRING,
					)
					expect(state.status).toBe(MOCK_STATUS.FAILED)
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
			expect(result).toBe(MOCK_STATE_VALUES.TRUE)
		})

		it('should return false when less than 60 seconds have passed', () => {
			const recentTimestamp =
				new Date().getTime() - MOCK_TIME.THIRTY_SECONDS_AGO
			const state = { lastFetch: recentTimestamp }
			const mockState = { travellers: state }
			const result = selectShouldUpdate(mockState)
			expect(result).toBe(MOCK_STATE_VALUES.FALSE)
		})
	})

	describe('updateTravellers', () => {
		describe('success scenarios', () => {
			describe('success scenarios', () => {
				it('should fetch and transform travellers data successfully', async () => {
					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () =>
							MOCK_API_RESPONSES.TRAVELLERS_RESPONSE,
					})

					const result = await store.dispatch(updateTravellers())

					expect(result.payload).toEqual([
						MOCK_TRAVELLERS.SAMPLE_TRAVELLER,
					])
				})
			})
		})
	})

	describe('reducer actions', () => {
		describe('setIsTraveller', () => {
			it('should set isTraveller to true', () => {
				store.dispatch(setIsTraveller(MOCK_STATE_VALUES.TRUE))
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(MOCK_STATE_VALUES.TRUE)
			})

			it('should set isTraveller to false', () => {
				store.dispatch(setIsTraveller(MOCK_STATE_VALUES.FALSE))
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(MOCK_STATE_VALUES.FALSE)
			})
		})

		describe('setTravellers', () => {
			it('should set travellers array and hasTravellers to true when array has items', () => {
				const mockTravellers = [MOCK_TRAVELLERS.TEST_TRAVELLER]
				store.dispatch(setTravellers(mockTravellers))

				const state = store.getState().travellers
				expect(state.travellers).toEqual(mockTravellers)
				expect(state.hasTravellers).toBe(MOCK_STATE_VALUES.TRUE)
			})

			it('should set travellers array and hasTravellers to false when array is empty', () => {
				store.dispatch(setTravellers(MOCK_STATE_VALUES.EMPTY_ARRAY))

				const state = store.getState().travellers
				expect(state.travellers).toEqual(MOCK_STATE_VALUES.EMPTY_ARRAY)
				expect(state.hasTravellers).toBe(MOCK_STATE_VALUES.FALSE)
			})
		})
	})

	describe('selectors', () => {
		beforeEach(() => {
			store.dispatch(setTravellers([MOCK_TRAVELLERS.TEST_TRAVELLER]))
			store.dispatch(setIsTraveller(MOCK_STATE_VALUES.TRUE))
			store.dispatch(setTravellerName(MOCK_TRAVELLERS.TEST_NAME))
		})

		it('should return travellers array from state', () => {
			const result = selectTravellers(store.getState())
			expect(result).toEqual([MOCK_TRAVELLERS.TEST_TRAVELLER])
		})

		it('should return hasTravellers boolean from state', () => {
			const result = selectHasTravellers(store.getState())
			expect(result).toBe(MOCK_STATE_VALUES.TRUE)
		})

		it('should return isTraveller boolean from state', () => {
			const result = selectIsTraveller(store.getState())
			expect(result).toBe(MOCK_STATE_VALUES.TRUE)
		})

		it('should return travellerName string from state', () => {
			const result = selectTravellerName(store.getState())
			expect(result).toBe(MOCK_TRAVELLERS.TEST_NAME)
		})
	})
})
