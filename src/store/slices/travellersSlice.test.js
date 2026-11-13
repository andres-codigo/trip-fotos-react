import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	onTestFinished,
	vi,
} from 'vitest'
import configureTestStore from '@/testUtils/configureTestStore'

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
	updateTraveller,
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
	loadPublicTrips,
	selectPublicTrips,
	selectTravellers,
	selectHasTravellers,
	selectIsTraveller,
	selectIsTravellerKnown,
	selectTravellerName,
	selectSelectedTraveller,
	selectUploadProgress,
} from './travellersSlice'

import { GLOBAL } from '@/constants/ui'
import { handleApiError } from '@/utils/errorHandler'
import { updateProfile } from 'firebase/auth'
import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytes,
	uploadBytesResumable,
} from 'firebase/storage'
import imageCompression from 'browser-image-compression'
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
	uploadBytes: vi.fn((storageRef) => Promise.resolve({ ref: storageRef })),
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
	store = configureTestStore({
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

// Register writes the trip and its public summary in one root update
const savedUpdate = (call = -1) => JSON.parse(fetch.mock.calls.at(call)[1].body)
const savedRecord = (call = -1) =>
	savedUpdate(call)[`travellers/${MOCK_USER.USER_ID}`]

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
					publicTrips: [],
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

				it('should pass the profile update error and traveller name to handleApiError', async () => {
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
				// The full records need sign-in
				expect(fetch.mock.calls[0][0]).toContain(
					`/travellers.json?auth=${MOCK_USER.TOKEN}`,
				)
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
			tripDescription:
				MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription,
			tripStart: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
			tripEnd: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
			cities: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.cities,
			files: [
				{
					name: 'test.jpg',
					file: new Blob(),
					alt: 'Lake Burley Griffin',
				},
			],
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
					tripDescription:
						MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripDescription,
					tripStart: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
					tripEnd: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
					cities: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.cities,
					files: ['https://mock-url.com/image.jpg'],
				})
				// Trip length is worked out from the dates, so the old field is no longer written
				const savedBody = savedRecord()
				expect(savedBody.fileAlts).toEqual(['Lake Burley Griffin'])
				expect(savedBody).toMatchObject({
					tripStart: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
					tripEnd: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripEnd,
				})
				expect(savedBody).not.toHaveProperty('daysInCity')
				// The public summary goes in the same update, without the description
				const summary =
					savedUpdate()[`publicTrips/${MOCK_USER.USER_ID}`]
				expect(summary).toMatchObject({
					firstName: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.firstName,
					cities: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.cities,
					tripStart: MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE.tripStart,
					photos: [
						expect.objectContaining({
							url: 'https://mock-url.com/image.jpg',
							alt: 'Lake Burley Griffin',
						}),
					],
				})
				expect(summary).not.toHaveProperty('tripDescription')
				expect(summary).not.toHaveProperty('lastName')

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

			it('should store the measured dimensions of each compressed file, aligned with files', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				vi.stubGlobal(
					'createImageBitmap',
					vi.fn().mockResolvedValue({ width: 1600, height: 900 }),
				)

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				const body = savedRecord(0)
				expect(body.files).toHaveLength(1)
				expect(body.fileDimensions).toEqual([
					{ width: 1600, height: 900 },
				])
				expect(result.payload.fileDimensions).toEqual(
					body.fileDimensions,
				)
				vi.unstubAllGlobals()
			})

			it('should still upload with a null dimension when measuring fails', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				vi.stubGlobal(
					'createImageBitmap',
					vi.fn().mockRejectedValue(new Error('undecodable')),
				)

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload.files).toHaveLength(1)
				expect(result.payload.fileDimensions).toEqual([null])
				vi.unstubAllGlobals()
			})

			it('should upload a thumbnail per width next to the photo and store them aligned with files', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				vi.stubGlobal(
					'createImageBitmap',
					vi.fn().mockResolvedValue({ width: 1600, height: 800 }),
				)
				getDownloadURL.mockImplementation((path) =>
					Promise.resolve(`https://mock-url.com${path}`),
				)

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				const paths = uploadBytes.mock.calls.map(([path]) => path)
				expect(paths).toHaveLength(GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length)
				GLOBAL.IMAGE_THUMBNAIL_WIDTHS.forEach((width) => {
					expect(paths).toContainEqual(
						expect.stringMatching(
							new RegExp(
								`^/images/${MOCK_USER.USER_ID}/.+-${width}w-test\\.jpg$`,
							),
						),
					)
					// A 2:1 photo is scaled so its shortest side fills the square tile
					expect(imageCompression).toHaveBeenCalledWith(
						expect.anything(),
						expect.objectContaining({
							maxWidthOrHeight: width * 2,
						}),
					)
				})
				const body = savedRecord(0)
				expect(body.fileThumbnails).toHaveLength(body.files.length)
				expect(body.fileThumbnails[0]).toEqual(
					GLOBAL.IMAGE_THUMBNAIL_WIDTHS.map((width) => ({
						width,
						url: expect.stringContaining(`-${width}w-test.jpg`),
					})),
				)
				expect(result.payload.fileThumbnails).toEqual(
					body.fileThumbnails,
				)
				getDownloadURL.mockImplementation(() =>
					Promise.resolve('https://mock-url.com/image.jpg'),
				)
				vi.unstubAllGlobals()
			})

			it('should still register, keeping the thumbnails that uploaded, when one fails', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_USER.USER_ID }),
				})
				uploadBytes.mockRejectedValueOnce(new Error('thumbnail failed'))

				const result = await store.dispatch(
					registerTraveller(mockRegistrationData),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload.files).toHaveLength(1)
				expect(result.payload.fileThumbnails[0]).toHaveLength(
					GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length - 1,
				)
				expect(deleteObject).not.toHaveBeenCalled()
			})

			describe('when a thumbnail download URL cannot be read', () => {
				const failingWidth = GLOBAL.IMAGE_THUMBNAIL_WIDTHS[0]
				const isFailingThumbnail = (path) =>
					String(path).includes(`-${failingWidth}w-`)

				beforeEach(() => {
					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () => ({ name: MOCK_USER.USER_ID }),
					})
					getDownloadURL.mockImplementation((path) =>
						isFailingThumbnail(path)
							? Promise.reject(new Error('url failed'))
							: Promise.resolve('https://mock-url.com/image.jpg'),
					)
				})

				afterEach(() => {
					getDownloadURL.mockImplementation(() =>
						Promise.resolve('https://mock-url.com/image.jpg'),
					)
				})

				it('should delete that thumbnail, leaving no stored object behind, and still register', async () => {
					const result = await store.dispatch(
						registerTraveller(mockRegistrationData),
					)

					expect(result.meta.requestStatus).toBe('fulfilled')
					expect(result.payload.fileThumbnails[0]).toHaveLength(
						GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length - 1,
					)
					const failingPath = uploadBytes.mock.calls
						.map(([path]) => path)
						.find(isFailingThumbnail)
					expect(deleteObject).toHaveBeenCalledTimes(1)
					expect(deleteObject).toHaveBeenCalledWith(failingPath)
				})

				it('should still register when that thumbnail is already gone', async () => {
					deleteObject.mockRejectedValueOnce({
						code: 'storage/object-not-found',
					})

					const result = await store.dispatch(
						registerTraveller(mockRegistrationData),
					)

					expect(result.meta.requestStatus).toBe('fulfilled')
					expect(deleteObject).toHaveBeenCalledTimes(1)
				})
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

			describe('cleaning up uploads', () => {
				const sixFiles = {
					...mockRegistrationData,
					files: Array.from({ length: 6 }, (_, i) => ({
						name: `${i}.jpg`,
						file: new Blob(),
					})),
				}

				const uploaded = (name) => ({
					on: (event, progress, error, complete) => complete(),
					snapshot: { ref: name },
				})

				it('should delete every uploaded file when the database write fails', async () => {
					fetch.mockResolvedValueOnce({ ok: false })

					const result = await store.dispatch(
						registerTraveller(mockRegistrationData),
					)

					expect(result.meta.requestStatus).toBe('rejected')
					expect(deleteObject).toHaveBeenCalledTimes(
						1 + GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length,
					)
					expect(deleteObject).toHaveBeenCalledWith('mock-ref')
					GLOBAL.IMAGE_THUMBNAIL_WIDTHS.forEach((width) =>
						expect(deleteObject).toHaveBeenCalledWith(
							expect.stringContaining(`-${width}w-test.jpg`),
						),
					)
				})

				it('should delete the earlier batch and the settled uploads of the failing batch', async () => {
					// The sixth file is the only one in the second batch and fails
					Array.from({ length: 6 }, (_, i) => `ref-${i}`).forEach(
						(name) =>
							uploadBytesResumable.mockImplementationOnce(() =>
								name === 'ref-5'
									? {
											on: (event, progress, error) =>
												error(new Error('boom')),
											snapshot: { ref: name },
										}
									: uploaded(name),
							),
					)

					const result = await store.dispatch(
						registerTraveller(sixFiles),
					)

					expect(result.meta.requestStatus).toBe('rejected')
					expect(fetch).not.toHaveBeenCalled()
					const deleted = deleteObject.mock.calls.map(
						([target]) => target,
					)
					const photos = deleted.filter((target) =>
						target.startsWith('ref-'),
					)
					expect(photos).toHaveLength(5)
					expect(new Set(photos)).toEqual(
						new Set(['ref-0', 'ref-1', 'ref-2', 'ref-3', 'ref-4']),
					)
					// The failing photo's thumbnails settle before the cleanup, so none are left behind
					expect(deleted.length - photos.length).toBe(
						6 * GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length,
					)
				})

				it('should still report the registration error when a cleanup delete fails', async () => {
					fetch.mockResolvedValueOnce({ ok: false })
					deleteObject.mockRejectedValueOnce(new Error('denied'))

					const result = await store.dispatch(
						registerTraveller(mockRegistrationData),
					)

					expect(result.meta.requestStatus).toBe('rejected')
					expect(handleApiError).toHaveBeenCalledWith(
						expect.objectContaining({
							message:
								ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER,
						}),
						`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${MOCK_USER.USER_ID}.`,
					)
				})

				it('should delete nothing when nothing was uploaded', async () => {
					fetch.mockResolvedValueOnce({ ok: false })

					await store.dispatch(
						registerTraveller({
							...mockRegistrationData,
							files: [],
						}),
					)

					expect(deleteObject).not.toHaveBeenCalled()
				})

				it('should not delete anything after a successful registration', async () => {
					fetch.mockResolvedValueOnce({
						ok: true,
						json: async () => ({ name: MOCK_USER.USER_ID }),
					})

					await store.dispatch(
						registerTraveller(mockRegistrationData),
					)

					expect(deleteObject).not.toHaveBeenCalled()
				})
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

	describe('updateTraveller', () => {
		const kept = {
			url: 'https://storage.example.com/images/u/kept.jpg',
			dimensions: { width: 800, height: 600 },
			thumbnails: [
				{ width: 320, url: 'https://storage.example.com/k-320.jpg' },
			],
		}
		const removed = {
			url: 'https://storage.example.com/images/u/removed.jpg',
			dimensions: { width: 600, height: 800 },
			thumbnails: [
				{ width: 320, url: 'https://storage.example.com/r-320.jpg' },
			],
		}
		const existing = {
			...MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE,
			id: MOCK_USER.USER_ID,
			daysInCity: 8,
			registered: '2025-04-02T10:00:00.000Z',
			files: [kept.url, removed.url],
		}
		const edit = {
			firstName: 'Amara',
			lastName: 'Okafor',
			tripDescription: 'Cherry blossom season.',
			tripStart: '2025-03-12',
			tripEnd: '2025-03-19',
			cities: ['tokyo'],
			files: [],
			keptPhotos: [kept],
			removedPhotos: [removed],
		}

		const preloadStore = () =>
			configureTestStore({
				reducer: { travellers: travellersReducer },
				preloadedState: {
					travellers: {
						travellerName: '',
						isTraveller: true,
						hasTravellers: true,
						travellers: [existing, { id: 'someone-else' }],
						selectedTraveller: existing,
						lastFetch: null,
						status: 'idle',
						error: null,
						uploadProgress: null,
					},
				},
			})

		// The edit is one root update of each field plus the public summary
		const savedBody = () =>
			Object.fromEntries(
				Object.entries(savedUpdate())
					.filter(([path]) => path.startsWith('travellers/'))
					.map(([path, value]) => [path.split('/').at(-1), value]),
			)

		describe('success scenarios', () => {
			it('should patch the edited fields and the kept photos, dropping the old length', async () => {
				const testStore = preloadStore()
				fetch.mockResolvedValueOnce({ ok: true })

				const result = await testStore.dispatch(updateTraveller(edit))

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(fetch).toHaveBeenCalledWith(
					expect.stringContaining(`/.json?auth=${MOCK_USER.TOKEN}`),
					expect.objectContaining({ method: 'PATCH' }),
				)
				expect(savedBody()).toEqual({
					firstName: 'Amara',
					lastName: 'Okafor',
					tripDescription: 'Cherry blossom season.',
					tripStart: '2025-03-12',
					tripEnd: '2025-03-19',
					daysInCity: null,
					cities: ['tokyo'],
					files: [kept.url],
					fileDimensions: [kept.dimensions],
					fileThumbnails: [kept.thumbnails],
					fileAlts: [null],
				})
				// registered is not part of an edit, so the stored date stays as it was
				expect(savedBody()).not.toHaveProperty('registered')
				expect(
					savedUpdate()[`publicTrips/${MOCK_USER.USER_ID}`],
				).toEqual({
					firstName: 'Amara',
					lastInitial: 'O',
					cities: ['tokyo'],
					tripStart: '2025-03-12',
					tripEnd: '2025-03-19',
					daysInCity: null,
					photos: [
						{
							url: kept.url,
							dimensions: kept.dimensions,
							thumbnails: kept.thumbnails,
							alt: null,
						},
					],
				})
			})

			it('should delete each removed photo and its thumbnails only after the record is saved', async () => {
				const testStore = preloadStore()
				const order = []
				fetch.mockImplementationOnce(async () => {
					order.push('save')
					return { ok: true }
				})
				deleteObject.mockImplementation(async (target) => {
					order.push(target)
				})
				onTestFinished(() =>
					deleteObject.mockImplementation(() => Promise.resolve()),
				)

				await testStore.dispatch(updateTraveller(edit))

				expect(order).toEqual([
					'save',
					removed.url,
					removed.thumbnails[0].url,
				])
				expect(deleteObject).not.toHaveBeenCalledWith(kept.url)
			})

			it('should still save when a removed photo cannot be deleted', async () => {
				const testStore = preloadStore()
				fetch.mockResolvedValueOnce({ ok: true })
				deleteObject
					.mockRejectedValueOnce(new Error('storage down'))
					.mockRejectedValueOnce(new Error('storage down'))

				const result = await testStore.dispatch(updateTraveller(edit))

				expect(result.meta.requestStatus).toBe('fulfilled')
			})

			it('should append new uploads after the kept photos', async () => {
				const testStore = preloadStore()
				fetch.mockResolvedValueOnce({ ok: true })

				await testStore.dispatch(
					updateTraveller({
						...edit,
						keptPhotos: [{ ...kept, alt: '  Shibuya crossing ' }],
						files: [
							{
								name: 'new.jpg',
								file: new Blob(),
								alt: 'Ueno Park',
							},
						],
					}),
				)

				const body = savedBody()
				// Descriptions line up with the photos, trimmed
				expect(body.fileAlts).toEqual(['Shibuya crossing', 'Ueno Park'])
				expect(body.files).toEqual([
					kept.url,
					'https://mock-url.com/image.jpg',
				])
				expect(body.fileDimensions).toHaveLength(2)
				expect(body.fileThumbnails[1]).toHaveLength(
					GLOBAL.IMAGE_THUMBNAIL_WIDTHS.length,
				)
			})

			it('should update the selected traveller, the list entry and the name', async () => {
				const testStore = preloadStore()
				fetch.mockResolvedValueOnce({ ok: true })

				await testStore.dispatch(updateTraveller(edit))

				const state = testStore.getState().travellers
				expect(state.selectedTraveller).toMatchObject({
					id: MOCK_USER.USER_ID,
					tripDescription: 'Cherry blossom season.',
					files: [kept.url],
					registered: existing.registered,
				})
				expect(state.selectedTraveller).not.toHaveProperty(
					'daysInCity',
					8,
				)
				expect(state.travellers[0]).toMatchObject({
					firstName: 'Amara',
					files: [kept.url],
				})
				expect(state.travellers[1]).toEqual({ id: 'someone-else' })
				expect(state.travellerName).toBe('Amara Okafor')
				expect(updateProfile).toHaveBeenCalledWith(MOCK_AUTH_USER, {
					displayName: 'Amara Okafor',
				})
			})
		})

		describe('failure scenarios', () => {
			it('should reject with the save message, delete nothing kept or removed, and remove its own uploads', async () => {
				const testStore = preloadStore()
				fetch.mockResolvedValueOnce({ ok: false })

				const result = await testStore.dispatch(
					updateTraveller({
						...edit,
						files: [{ name: 'new.jpg', file: new Blob() }],
					}),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					ERROR_MESSAGES.FAILED_TO_SAVE_TRIP,
				)
				expect(deleteObject).not.toHaveBeenCalledWith(removed.url)
				expect(deleteObject).not.toHaveBeenCalledWith(kept.url)
				expect(deleteObject).toHaveBeenCalledWith('mock-ref')

				const state = testStore.getState().travellers
				expect(state.selectedTraveller).toEqual(existing)
				expect(state.uploadProgress).toBeNull()
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
				expect(fetch.mock.calls[0][0]).toContain(
					`/travellers/${mockId}.json?auth=${MOCK_USER.TOKEN}`,
				)
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

				store = configureTestStore({
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

				const testStore = configureTestStore({
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
			configureTestStore({
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
				// The record and its public summary go in one root update
				if (url.includes('/.json')) {
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
					expect.stringContaining(`/.json?auth=${MOCK_USER.TOKEN}`),
					expect.objectContaining({ method: 'PATCH' }),
				)
				expect(savedUpdate(0)).toEqual({
					[`travellers/${travellerId}`]: null,
					[`publicTrips/${travellerId}`]: null,
				})
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

			it('should stop the user being a traveller when they delete their own profile', async () => {
				const testStore = configureTestStore({
					reducer: { travellers: travellersReducer },
					preloadedState: {
						travellers: {
							travellerName: 'Amara Okafor',
							isTraveller: true,
							hasTravellers: true,
							travellers: [{ id: MOCK_USER.USER_ID, files }],
							selectedTraveller: null,
							lastFetch: new Date().getTime(),
							status: 'idle',
							error: null,
						},
					},
				})
				fetch.mockImplementation(async (url, options) =>
					options?.method === 'GET'
						? { ok: true, json: async () => null }
						: { ok: true },
				)

				const result = await testStore.dispatch(
					deleteTraveller({ travellerId: MOCK_USER.USER_ID, files }),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				const state = testStore.getState().travellers
				expect(state.isTraveller).toBe(false)
				expect(state.travellerName).toBe('')
			})

			it('should keep an admin a traveller when they delete someone else', async () => {
				const testStore = preloadStore()
				testStore.dispatch(setIsTraveller(true))
				mockFetchByUrl()

				await testStore.dispatch(
					deleteTraveller({ travellerId, files }),
				)

				expect(testStore.getState().travellers.isTraveller).toBe(true)
			})

			it('should delete each thumbnail too, read from an array or an index-keyed object', async () => {
				const testStore = preloadStore()
				mockFetchByUrl()
				const thumbnail = (name) => ({
					width: 320,
					url: `https://storage.example.com/${name}`,
				})

				const result = await testStore.dispatch(
					deleteTraveller({
						travellerId,
						files,
						fileThumbnails: {
							0: [thumbnail('one-320w'), thumbnail('one-640w')],
							1: [thumbnail('two-320w')],
						},
					}),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(deleteObject).toHaveBeenCalledTimes(files.length + 3)
				;['one-320w', 'one-640w', 'two-320w'].forEach((name) =>
					expect(ref).toHaveBeenCalledWith(
						undefined,
						`https://storage.example.com/${name}`,
					),
				)
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
						`/travellers/${MOCK_USER.USER_ID}.json?auth=${MOCK_USER.TOKEN}&shallow=true`,
					),
					expect.any(Object),
				)
				expect(store.getState().travellers).toMatchObject({
					isTraveller: true,
					isTravellerCheckedFor: MOCK_USER.USER_ID,
				})
			})

			it('should take travellerName from the record when the Auth display name is missing', async () => {
				const json = (value) => ({ ok: true, json: async () => value })
				global.fetch
					.mockResolvedValueOnce(json({ firstName: true }))
					.mockResolvedValueOnce(json('Ada'))
					.mockResolvedValueOnce(json('Lovelace'))

				await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

				expect(global.fetch).toHaveBeenCalledWith(
					expect.stringContaining(
						`/travellers/${MOCK_USER.USER_ID}/firstName.json`,
					),
					expect.any(Object),
				)
				expect(store.getState().travellers.travellerName).toBe(
					'Ada Lovelace',
				)
			})

			it('should still confirm the traveller, keeping the session name, when the record name cannot be read', async () => {
				store.dispatch(setTravellerName(MOCK_USER.FULL_NAME))
				global.fetch
					.mockResolvedValueOnce({
						ok: true,
						json: async () => ({ firstName: true }),
					})
					.mockResolvedValueOnce({ ok: false, status: 500 })
					.mockResolvedValueOnce({ ok: false, status: 500 })

				const result = await store.dispatch(
					checkIsTraveller(MOCK_USER.USER_ID),
				)

				expect(result.payload).toBe(true)
				expect(store.getState().travellers).toMatchObject({
					isTraveller: true,
					travellerName: MOCK_USER.FULL_NAME,
				})
			})

			it('should keep the record answer when the session restores after it', async () => {
				global.fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})
				await store.dispatch(checkIsTraveller(MOCK_USER.USER_ID))

				// The persisted userId starts the check before tryLogin resolves; a stale display name must not come back
				store.dispatch({
					type: 'authentication/tryLogin/fulfilled',
					payload: { userName: MOCK_USER.FULL_NAME },
				})

				expect(store.getState().travellers.travellerName).toBe('')
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
			'should reset isTraveller, travellerName and selectedTraveller on %s',
			async (_, action) => {
				store.dispatch(
					loadTraveller.fulfilled(
						{ id: 'other', firstName: 'Ada' },
						'req',
						'other',
					),
				)
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
					selectedTraveller: null,
				})
			},
		)

		it('should drop the signed-in list, which is persisted, on logout', () => {
			store.dispatch(
				setTravellers([MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE]),
			)

			store.dispatch(logout.fulfilled(undefined, 'req'))

			expect(store.getState().travellers).toMatchObject({
				travellers: [],
				hasTravellers: false,
				lastFetch: null,
			})
		})
	})

	describe('loadPublicTrips', () => {
		it('should read the public summaries without a token, newest trip first', async () => {
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					older: { firstName: 'Kofi', tripStart: '2024-04-02' },
					undated: { firstName: 'Noor', daysInCity: 5 },
					newer: { firstName: 'Amara', tripStart: '2025-03-12' },
				}),
			})

			const result = await store.dispatch(loadPublicTrips())

			const [url, options] = fetch.mock.calls[0]
			expect(url).toContain('/publicTrips.json')
			expect(url).not.toContain('auth=')
			expect(options.method).toBe('GET')
			expect(result.payload.map(({ id }) => id)).toEqual([
				'newer',
				'older',
				'undated',
			])
			expect(selectPublicTrips(store.getState())).toEqual(result.payload)
		})

		it('should return an empty list when nobody has a trip yet', async () => {
			fetch.mockResolvedValueOnce({ ok: true, json: async () => null })

			const result = await store.dispatch(loadPublicTrips())

			expect(result.payload).toEqual([])
		})

		it('should reject with the handled error and keep the last list', async () => {
			fetch.mockResolvedValueOnce({ ok: false })
			handleApiError.mockReturnValueOnce(
				'Travellers could not be loaded.',
			)

			const result = await store.dispatch(loadPublicTrips())

			expect(result.meta.requestStatus).toBe('rejected')
			expect(result.payload).toBe('Travellers could not be loaded.')
			expect(selectPublicTrips(store.getState())).toEqual([])
		})
	})

	describe('reducer actions', () => {
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

		it('should read the travellers, flags and name from state', () => {
			const state = store.getState()

			expect(selectTravellers(state)).toEqual([
				MOCK_TRAVELLERS.TEST_TRAVELLER,
			])
			expect(selectHasTravellers(state)).toBe(true)
			expect(selectIsTraveller(state)).toBe(true)
			expect(selectTravellerName(state)).toBe(MOCK_TRAVELLERS.TEST_NAME)
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
