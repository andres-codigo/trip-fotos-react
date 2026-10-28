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

import { authActions, logout, selectUserId } from './authenticationSlice'
import travellersReducer, {
	registerTraveller,
	travellerName,
	setTravellerName,
	selectShouldUpdate,
	updateTravellers,
	loadTraveller,
	loadTravellers,
	deleteTraveller,
	checkIsTraveller,
	setIsTraveller,
	setTravellers,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
	selectIsTravellerKnown,
	selectTravellerName,
	selectSelectedTraveller,
	selectUploadProgress,
} from './travellersSlice'

import { handleApiError } from '@/utils/errorHandler'
import { updateProfile } from 'firebase/auth'
import { deleteObject, ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseStorage } from '@/services/firebase/firebase'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

const MOCK_AUTH_USER = { uid: 'mock-auth-user' }

vi.mock('@/services/firebase/firebase', () => ({
	getFirebaseAuth: vi.fn(() => ({ currentUser: MOCK_AUTH_USER })),
	getFirebaseStorage: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
	updateProfile: vi.fn(() => Promise.resolve()),
}))

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
	ref: vi.fn((storage, path) => path),
	deleteObject: vi.fn(() => Promise.resolve()),
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

// messagesSlice is imported via deleteTraveller and needs selectUserId and logout at load time
vi.mock('./authenticationSlice', async () => {
	const { createAction, createAsyncThunk } = await import('@reduxjs/toolkit')
	return {
		authActions: {
			clearUser: createAction('authentication/clearUser'),
		},
		selectAuthenticationToken: vi.fn(() => MOCK_USER.TOKEN),
		selectUserId: vi.fn(() => MOCK_USER.USER_ID),
		logout: createAsyncThunk('authentication/logout', async () => {}),
	}
})

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
					isTravellerCheckedFor: null,
					hasTravellers: false,
					travellers: [],
					selectedTraveller: null,
					lastFetch: null,
					status: 'idle',
					error: null,
					uploadProgress: null,
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

				it('should update the Auth display name and travellerName on success', async () => {
					await store.dispatch(
						travellerName({
							first: MOCK_USER.FIRST_NAME,
							last: MOCK_USER.LAST_NAME,
						}),
					)

					expect(updateProfile).toHaveBeenCalledWith(MOCK_AUTH_USER, {
						displayName: MOCK_USER.FULL_NAME,
					})
					expect(fetch).not.toHaveBeenCalled()
					const state = store.getState().travellers
					expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)
					expect(state.status).toBe('succeeded')
				})
			})

			describe('failure scenarios', () => {
				it('should set error and reset travellerName when the profile update fails', async () => {
					updateProfile.mockRejectedValueOnce(
						new Error(API_ERROR_MESSAGE.NETWORK_ERROR),
					)

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
					updateProfile.mockRejectedValueOnce(mockError)

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

				selectUserId.mockReturnValueOnce(userId)

				const result = await store.dispatch(updateTravellers())
				expect(result.payload[0]).toEqual(loggedInTraveller)

				const state = store.getState().travellers
				expect(state.travellerName).toBe(MOCK_USER.FULL_NAME)
			})

			it('should clear a stale travellerName when the logged-in record is missing', async () => {
				store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						other: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO,
					}),
				})
				selectUserId.mockReturnValueOnce('user1')

				await store.dispatch(updateTravellers())

				expect(store.getState().travellers.travellerName).toBe('')
			})

			it('should keep travellerName when nobody is logged in', async () => {
				store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						other: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO,
					}),
				})
				selectUserId.mockReturnValueOnce(null)

				await store.dispatch(updateTravellers())

				expect(store.getState().travellers.travellerName).toBe(
					MOCK_USER.FULL_NAME,
				)
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
				// Without the initialised app, Storage throws app/no-app
				expect(getFirebaseStorage).toHaveBeenCalled()
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

			it('should set the Auth display name and userName to the registered name', async () => {
				const fullName = `${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName} ${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName}`
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})

				await store.dispatch(registerTraveller(mockRegistrationData))

				expect(fetch).toHaveBeenCalledTimes(1)
				expect(updateProfile).toHaveBeenCalledWith(MOCK_AUTH_USER, {
					displayName: fullName,
				})
				expect(localStorage.setItem).toHaveBeenCalledWith(
					'userName',
					fullName,
				)
				expect(store.getState().travellers.travellerName).toBe(fullName)
			})

			it('should still register the traveller when the name update fails', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				updateProfile.mockRejectedValueOnce(new Error('profile failed'))

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				const state = store.getState().travellers
				expect(state.isTraveller).toBe(true)
				expect(state.travellerName).toBe(
					`${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName} ${MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.lastName}`,
				)
			})
		})

		describe('upload progress', () => {
			const twoFiles = {
				...mockRegistrationData,
				files: [
					{ name: 'one.jpg', file: new Blob() },
					{ name: 'two.jpg', file: new Blob() },
				],
			}

			const stubUpload = ({ snapshots = [], fail = false } = {}) =>
				uploadBytesResumable.mockImplementationOnce(() => ({
					on: (event, progress, error, complete) => {
						if (fail) {
							error(new Error('boom'))
							return
						}
						snapshots.forEach((snapshot) => progress(snapshot))
						complete()
					},
					snapshot: { ref: 'mock-ref' },
				}))

			const collectProgress = () => {
				const seen = []
				store.subscribe(() => {
					const progress = selectUploadProgress(store.getState())
					if (progress) seen.push(progress)
				})
				return seen
			}

			it('should report the file count and percentage as files upload, then clear it', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				stubUpload({
					snapshots: [{ bytesTransferred: 50, totalBytes: 100 }],
				})
				stubUpload({
					snapshots: [{ bytesTransferred: 100, totalBytes: 100 }],
				})
				const seen = collectProgress()

				await store.dispatch(registerTraveller(twoFiles))

				expect(seen[0]).toEqual({
					uploadedFiles: 0,
					totalFiles: 2,
					percent: 0,
				})
				expect(seen).toContainEqual({
					uploadedFiles: 0,
					totalFiles: 2,
					percent: 25,
				})
				expect(seen.at(-1)).toEqual({
					uploadedFiles: 2,
					totalFiles: 2,
					percent: 100,
				})
				expect(selectUploadProgress(store.getState())).toBeNull()
			})

			it('should not count a file as uploaded before its download URL is ready', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				stubUpload({
					snapshots: [{ bytesTransferred: 100, totalBytes: 100 }],
				})
				const seen = collectProgress()

				await store.dispatch(registerTraveller(mockRegistrationData))

				const beforeUrl = seen.find(({ percent }) => percent === 99)
				expect(beforeUrl).toEqual({
					uploadedFiles: 0,
					totalFiles: 1,
					percent: 99,
				})
			})

			it('should only dispatch when the visible value changes', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				stubUpload({
					snapshots: [
						{ bytesTransferred: 10, totalBytes: 100 },
						{ bytesTransferred: 10, totalBytes: 100 },
						{ bytesTransferred: 10, totalBytes: 100 },
					],
				})
				const seen = collectProgress()

				await store.dispatch(registerTraveller(mockRegistrationData))

				const tens = seen.filter(({ percent }) => percent === 10)
				expect(tens).toHaveLength(1)
			})

			it('should not report progress when there are no photos', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				const seen = collectProgress()

				await store.dispatch(
					registerTraveller({ ...mockRegistrationData, files: [] }),
				)

				expect(seen).toEqual([])
			})

			it('should clear the progress when an upload fails', async () => {
				stubUpload({ fail: true })

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(selectUploadProgress(store.getState())).toBeNull()
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
				expect(fetch).toHaveBeenCalledTimes(1)
				expect(handleApiError).toHaveBeenCalledWith(
					expect.objectContaining({
						message: ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER,
					}),
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${MOCK_USER.USER_ID}.`,
				)

				const state = store.getState().travellers
				expect(state.status).toBe('failed')
				expect(state.isTraveller).toBe(false)
				expect(state.travellers).toEqual([])
			})

			it('should report the registration as failed when the connection drops', async () => {
				fetch.mockRejectedValueOnce(
					new Error(API_ERROR_MESSAGE.NETWORK_ERROR),
				)

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalledWith(
					expect.objectContaining({
						message: ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER,
					}),
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

			it('should clear a persisted selected traveller that no longer exists', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTravellerData,
				})
				await store.dispatch(loadTraveller(mockId))
				expect(
					store.getState().travellers.selectedTraveller,
				).not.toBeNull()

				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})
				await store.dispatch(loadTraveller(mockId))

				expect(store.getState().travellers.selectedTraveller).toBeNull()
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

	describe('deleteTraveller', () => {
		const travellerId = 'traveller-to-delete'
		const files = [
			'https://storage.example.com/images/traveller-to-delete/one.jpg',
			'https://storage.example.com/images/traveller-to-delete/two.jpg',
		]
		const remainingTraveller = {
			...MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE,
			id: 'remaining-traveller',
		}

		const preloadStore = () =>
			configureStore({
				reducer: { travellers: travellersReducer },
				preloadedState: {
					travellers: {
						travellerName: '',
						isTraveller: false,
						hasTravellers: true,
						travellers: [
							remainingTraveller,
							{ id: travellerId, files },
						],
						selectedTraveller: { id: travellerId },
						lastFetch: new Date().getTime(),
						status: 'idle',
						error: null,
					},
				},
			})

		const mockFetchByUrl = ({
			travellerOk = true,
			messagesOk = true,
		} = {}) =>
			fetch.mockImplementation(async (url, options) => {
				if (url.includes('/travellers/')) {
					return { ok: travellerOk }
				}
				if (url.includes('/messages/')) {
					return { ok: messagesOk }
				}
				if (options?.method === 'GET') {
					return {
						ok: true,
						json: async () => ({
							[remainingTraveller.id]: remainingTraveller,
						}),
					}
				}
				throw new Error(`Unexpected request: ${url}`)
			})

		describe('success scenarios', () => {
			it('should delete the record, images and messages, then force a list refresh', async () => {
				const testStore = preloadStore()
				mockFetchByUrl()

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(fetch).toHaveBeenCalledWith(
					expect.stringContaining(
						`/travellers/${travellerId}.json?auth=${MOCK_USER.TOKEN}`,
					),
					expect.objectContaining({ method: 'DELETE' }),
				)
				expect(getFirebaseStorage).toHaveBeenCalled()
				files.forEach((file) =>
					expect(ref).toHaveBeenCalledWith(undefined, file),
				)
				expect(deleteObject).toHaveBeenCalledTimes(files.length)
				expect(fetch).toHaveBeenCalledWith(
					expect.stringContaining(`/messages/${travellerId}.json`),
					expect.objectContaining({ method: 'DELETE' }),
				)
				// The cache is still fresh, so a GET proves the refresh was forced
				expect(fetch).toHaveBeenCalledWith(
					expect.stringContaining('/travellers.json'),
					expect.objectContaining({ method: 'GET' }),
				)

				const state = testStore.getState().travellers
				expect(state.status).toBe('succeeded')
				expect(state.travellers.map(({ id }) => id)).toEqual([
					remainingTraveller.id,
				])
				expect(state.selectedTraveller).toBeNull()
			})

			it('should skip Storage when the traveller has no images', async () => {
				const testStore = preloadStore()
				mockFetchByUrl()

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId }),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(deleteObject).not.toHaveBeenCalled()
			})

			it('should treat an already-missing image as deleted', async () => {
				const testStore = preloadStore()
				mockFetchByUrl()
				deleteObject.mockRejectedValueOnce({
					code: API_ERROR_MESSAGE.STORAGE_OBJECT_NOT_FOUND,
				})

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
			})
		})

		describe('failure scenarios', () => {
			it('should reject without touching Storage when the record delete fails', async () => {
				const testStore = preloadStore()
				mockFetchByUrl({ travellerOk: false })

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(deleteObject).not.toHaveBeenCalled()

				const state = testStore.getState().travellers
				expect(state.status).toBe('failed')
				expect(state.error).toContain(
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_CATCH}${travellerId}`,
				)
				expect(state.travellers).toHaveLength(2)
			})

			it('should reject when an image delete fails', async () => {
				const testStore = preloadStore()
				mockFetchByUrl()
				deleteObject.mockRejectedValueOnce({
					code: 'storage/unauthorized',
				})

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(fetch).not.toHaveBeenCalledWith(
					expect.stringContaining('/messages/'),
					expect.anything(),
				)
				expect(testStore.getState().travellers.status).toBe('failed')
			})

			it('should reject when the messages delete fails', async () => {
				const testStore = preloadStore()
				mockFetchByUrl({ messagesOk: false })

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_CATCH}${travellerId}`,
				)
			})

			it('should reject on a network error', async () => {
				const testStore = preloadStore()
				fetch.mockRejectedValueOnce(new Error('Network Error'))

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('checkIsTraveller', () => {
		it('should clear a stale travellerName when the record no longer exists', async () => {
			store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))
			global.fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => null,
			})

			await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

			expect(store.getState().travellers.travellerName).toBe('')
		})

		describe('success scenarios', () => {
			it('should set isTraveller to true when the traveller record exists', async () => {
				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ firstName: true, lastName: true }),
				})

				await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

				expect(global.fetch).toHaveBeenCalledWith(
					expect.stringContaining(
						`/travellers/${MOCK_USER.USER_ID}.json?shallow=true`,
					),
					expect.any(Object),
				)
				expect(store.getState().travellers).toMatchObject({
					isTraveller: true,
					isTravellerCheckedFor: MOCK_USER.USER_ID,
				})
			})

			it('should set isTraveller to false when there is no traveller record', async () => {
				store.dispatch(setIsTraveller(true))
				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})

				await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

				expect(store.getState().travellers.isTraveller).toBe(false)
			})
		})

		describe('failure scenarios', () => {
			it('should keep the last known value when the request fails', async () => {
				store.dispatch(setIsTraveller(true))
				global.fetch.mockResolvedValueOnce({ ok: false, status: 500 })

				const result = await store.dispatch(
					checkIsTraveller(MOCK_USER.USER_ID),
				)

				expect(result.payload).toBe(
					`${API_ERROR_MESSAGE.CHECK_IS_TRAVELLER_CATCH}${MOCK_USER.USER_ID}.: ${ERROR_MESSAGES.REQUEST_ERROR}`,
				)
				expect(store.getState().travellers).toMatchObject({
					isTraveller: true,
					isTravellerCheckedFor: MOCK_USER.USER_ID,
				})
			})
		})
	})

	describe('logout', () => {
		it.each([
			['clearUser', () => authActions.clearUser()],
			['logout fulfilled', () => logout.fulfilled(undefined, 'req')],
			['logout rejected', () => logout.rejected(null, 'req')],
		])(
			'should reset isTraveller and travellerName on %s',
			async (_, action) => {
				store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))
				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ firstName: true }),
				})
				await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

				store.dispatch(action())

				expect(store.getState().travellers).toMatchObject({
					isTraveller: false,
					isTravellerCheckedFor: null,
					travellerName: '',
				})
			},
		)
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

		it.each([
			[
				'the check has resolved for the current user',
				MOCK_USER.USER_ID,
				MOCK_USER.USER_ID,
				true,
			],
			['the check is still pending', null, MOCK_USER.USER_ID, false],
			[
				'the check was for a different user',
				'other-user',
				MOCK_USER.USER_ID,
				false,
			],
			['no user is logged in', null, null, false],
		])(
			'should return isTravellerKnown when %s',
			(_, isTravellerCheckedFor, userId, expected) => {
				const result = selectIsTravellerKnown({
					travellers: { isTravellerCheckedFor },
					authentication: { userId },
				})
				expect(result).toBe(expected)
			},
		)

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
