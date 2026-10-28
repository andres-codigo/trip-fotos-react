import {
	createSlice,
	createAsyncThunk,
	createSelector,
	isAnyOf,
} from '@reduxjs/toolkit'
import imageCompression from 'browser-image-compression'
import { updateProfile } from 'firebase/auth'
import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytesResumable,
} from 'firebase/storage'

import {
	getFirebaseAuth,
	getFirebaseStorage,
} from '@/services/firebase/firebase'

import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import { API_DATABASE, API_ERROR_MESSAGE } from '@/constants/api'
import { SESSION_STORAGE_KEYS } from '@/constants/auth'
import { ERROR_MESSAGES } from '@/constants/errors'

import {
	authActions,
	logout,
	selectAuthenticationToken,
	selectUserId,
} from './authenticationSlice'
import { deleteTravellerMessages } from './messagesSlice'

import { databaseRequest } from '@/store/databaseRequest'

import { handleApiError } from '@/utils/errorHandler'

const shouldUpdate = (state) => {
	const lastFetch = state.lastFetch
	if (!lastFetch) {
		return true
	}
	const currentTimeStamp = new Date().getTime()
	return (currentTimeStamp - lastFetch) / 1000 > 60
}

export const travellerName = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.TRAVELLER_NAME,
	async (data, { rejectWithValue, dispatch }) => {
		const fullName = `${data.first} ${data.last}`

		try {
			await updateProfile(getFirebaseAuth().currentUser, {
				displayName: fullName,
			})

			localStorage.setItem(SESSION_STORAGE_KEYS.USER_NAME, fullName)
			dispatch(setTravellerName(fullName))
			return fullName
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME_CATCH}${fullName}`,
				),
			)
		}
	},
)

export const registerTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.REGISTER_TRAVELLER,
	async (data, { getState, dispatch, rejectWithValue }) => {
		const userId = selectUserId(getState())
		const token = selectAuthenticationToken(getState())

		try {
			const MAX_CONCURRENT_UPLOADS = 5
			const imageQueue = [...(data.files || [])]
			const imageUrls = []

			const totalFiles = imageQueue.length
			const fractions = new Array(totalFiles).fill(0)
			let lastReported = ''

			// Snapshots arrive many times a second, so only a change the user can see reaches the store
			const reportProgress = () => {
				const uploadedFiles = fractions.filter(
					(fraction) => fraction === 1,
				).length
				const percent = Math.round(
					(fractions.reduce((sum, fraction) => sum + fraction, 0) /
						totalFiles) *
						100,
				)
				const key = `${uploadedFiles}/${percent}`
				if (key === lastReported) return
				lastReported = key
				dispatch(
					setUploadProgress({ uploadedFiles, totalFiles, percent }),
				)
			}

			if (totalFiles > 0) reportProgress()

			let nextIndex = 0
			const uploadImage = async (image) => {
				const index = nextIndex++
				const storage = getFirebaseStorage()
				const storageRef = ref(
					storage,
					// Distinct files can share a name, and the same path would overwrite the earlier upload
					`/images/${userId}/${crypto.randomUUID()}-${image.name}`,
				)

				const metadata = {
					customMetadata: {
						userId: userId,
					},
				}

				const compressedFile = await imageCompression(
					image.file || image,
					{
						maxSizeMB: 1,
						maxWidthOrHeight: 1920,
						useWebWorker: true,
					},
				)

				const uploadTask = uploadBytesResumable(
					storageRef,
					compressedFile,
					metadata,
				)

				return new Promise((resolve, reject) => {
					uploadTask.on(
						'state_changed',
						(snapshot) => {
							// A finished file is only counted once its download URL is in hand
							fractions[index] = Math.min(
								snapshot.bytesTransferred /
									(snapshot.totalBytes || 1),
								0.99,
							)
							reportProgress()
						},
						() => {
							reject(
								new Error(
									`Failed to upload image: ${image.name}`,
								),
							)
						},
						async () => {
							const url = await getDownloadURL(
								uploadTask.snapshot.ref,
							)
							fractions[index] = 1
							reportProgress()
							resolve(url)
						},
					)
				})
			}

			const uploadNextBatch = async () => {
				const batch = imageQueue.splice(0, MAX_CONCURRENT_UPLOADS)
				const batchPromises = batch.map(uploadImage)
				const batchResults = await Promise.all(batchPromises)
				imageUrls.push(...batchResults)
			}

			while (imageQueue.length > 0) {
				await uploadNextBatch()
			}

			const travellerData = {
				firstName: data.firstName,
				lastName: data.lastName,
				description: data.description,
				daysInCity: data.daysInCity,
				cities: data.cities,
				files: imageUrls,
				registered: new Date().toISOString(),
			}

			try {
				await databaseRequest(`/travellers/${userId}`, {
					method: API_DATABASE.PUT,
					token,
					body: travellerData,
				})
			} catch {
				// A bad status and a dropped connection both mean the record was not saved, which is what the user needs to hear
				throw new Error(ERROR_MESSAGES.FAILED_TO_REGISTER_TRAVELLER)
			}

			// The record is already saved, so a failed name update must not report the registration as failed
			await dispatch(
				travellerName({ first: data.firstName, last: data.lastName }),
			)

			return {
				...travellerData,
				id: userId,
			}
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${userId}.`,
				),
			)
		}
	},
)

export const updateTravellers = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.UPDATE_TRAVELLERS,
	async (_, { getState, rejectWithValue, dispatch }) => {
		try {
			const response = await databaseRequest('/travellers')

			const responseData = await response.json()

			// If responseData is falsy (null/undefined) or an empty object, return an empty array.
			if (
				!responseData ||
				(typeof responseData === 'object' &&
					Object.keys(responseData).length === 0)
			) {
				return []
			}

			const travellers = Object.keys(responseData).map((key) => ({
				id: key,
				firstName: responseData[key].firstName,
				lastName: responseData[key].lastName,
				description: responseData[key].description,
				daysInCity: responseData[key].daysInCity,
				cities: responseData[key].cities,
				files: responseData[key].files,
				registered: responseData[key].registered,
			}))

			const userId = selectUserId(getState())
			const loggedInTraveller = travellers.find(
				(traveller) => traveller.id === userId,
			)

			const filteredTravellers = travellers.filter(
				(traveller) => traveller.id !== userId,
			)

			if (loggedInTraveller) {
				filteredTravellers.unshift(loggedInTraveller)
				dispatch(
					setTravellerName(
						`${loggedInTraveller.firstName} ${loggedInTraveller.lastName}`,
					),
				)
				return filteredTravellers
			} else {
				if (userId) {
					dispatch(setTravellerName(''))
				}
				return travellers
			}
		} catch (error) {
			const isNetworkError =
				error instanceof TypeError ||
				error.message?.toLowerCase().includes('fetch') ||
				error.message?.toLowerCase().includes('network')

			if (isNetworkError) {
				return rejectWithValue(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR)
			}
			if (error instanceof SyntaxError) {
				return rejectWithValue(ERROR_MESSAGES.UNEXPECTED_ERROR)
			}
			return rejectWithValue(
				handleApiError(
					error,
					API_ERROR_MESSAGE.UPDATE_TRAVELLERS_CATCH,
				),
			)
		}
	},
)

export const loadTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLER,
	async (travellerId, { rejectWithValue }) => {
		try {
			const response = await databaseRequest(`/travellers/${travellerId}`)

			const responseData = await response.json()

			// Check if traveller exists (Firebase returns null for non-existent keys)
			if (!responseData) {
				throw new Error(ERROR_MESSAGES.DATA_NOT_FOUND)
			}

			return {
				...responseData,
				id: travellerId,
			}
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.LOAD_TRAVELLER_CATCH}${travellerId}.`,
				),
			)
		}
	},
)

export const checkIsTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER,
	async (userId, { rejectWithValue }) => {
		try {
			// shallow avoids downloading the whole record just to test it exists
			const response = await databaseRequest(`/travellers/${userId}`, {
				params: { shallow: true },
			})

			const responseData = await response.json()

			return responseData !== null
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.CHECK_IS_TRAVELLER_CATCH}${userId}.`,
				),
			)
		}
	},
)

export const loadTravellers = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS,
	async (
		{ forceRefresh = false },
		{ getState, dispatch, rejectWithValue },
	) => {
		try {
			const state = getState().travellers

			// Use the shouldUpdate helper function
			if (!forceRefresh && !shouldUpdate(state)) {
				return state.travellers
			}

			const travellers = await dispatch(updateTravellers()).unwrap()
			dispatch(setFetchTimestamp())
			return travellers
		} catch (error) {
			return rejectWithValue(error)
		}
	},
)

export const deleteTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.DELETE_TRAVELLER,
	async (
		{ travellerId, files = [] },
		{ getState, dispatch, rejectWithValue },
	) => {
		try {
			const token = selectAuthenticationToken(getState())

			await databaseRequest(`/travellers/${travellerId}`, {
				method: API_DATABASE.DELETE,
				token,
			})

			const storage = getFirebaseStorage()
			await Promise.all(
				files.map(async (fileUrl) => {
					try {
						await deleteObject(ref(storage, fileUrl))
					} catch (error) {
						// An already-missing image is the outcome we want, so a retry after a partial failure can still succeed
						if (
							error?.code !==
							API_ERROR_MESSAGE.STORAGE_OBJECT_NOT_FOUND
						) {
							throw error
						}
					}
				}),
			)

			await dispatch(deleteTravellerMessages(travellerId)).unwrap()
			// The record is already gone, so a failed refresh must not report the delete as failed
			await dispatch(loadTravellers({ forceRefresh: true }))

			return travellerId
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_CATCH}${travellerId}.`,
				),
			)
		}
	},
)

const travellersSlice = createSlice({
	name: 'travellers',
	initialState: {
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
	},
	reducers: {
		setTravellerName(state, action) {
			state.travellerName = action.payload
		},
		setIsTraveller(state, action) {
			state.isTraveller = action.payload
		},
		setTravellers(state, action) {
			state.travellers = action.payload
			state.hasTravellers = action.payload.length > 0
		},
		setFetchTimestamp(state) {
			state.lastFetch = new Date().getTime()
		},
		setUploadProgress(state, action) {
			state.uploadProgress = action.payload
		},
	},
	extraReducers: (builder) => {
		builder
			// TRAVELLER_NAME async thunk handlers
			.addCase(travellerName.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(travellerName.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.travellerName = action.payload
			})
			.addCase(travellerName.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// UPDATE_TRAVELLERS async thunk handlers
			.addCase(updateTravellers.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(updateTravellers.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.travellers = action.payload
				state.hasTravellers = action.payload.length > 0
			})
			.addCase(updateTravellers.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// LOAD_TRAVELLERS async thunk handlers
			.addCase(loadTravellers.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(loadTravellers.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.travellers = action.payload
				state.hasTravellers = action.payload.length > 0
			})
			.addCase(loadTravellers.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// LOAD_TRAVELLER async thunk handlers
			.addCase(loadTraveller.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(loadTraveller.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.selectedTraveller = action.payload
			})
			.addCase(loadTraveller.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
				// The persisted copy may be of a record that no longer exists
				if (state.selectedTraveller?.id === action.meta.arg) {
					state.selectedTraveller = null
				}
			})

			// REGISTER_TRAVELLER async thunk handlers
			.addCase(registerTraveller.pending, (state) => {
				state.status = 'loading'
				state.uploadProgress = null
			})
			.addCase(registerTraveller.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.uploadProgress = null
				state.travellers.unshift(action.payload)
				state.isTraveller = true
				state.hasTravellers = true
				state.travellerName = `${action.payload.firstName} ${action.payload.lastName}`
			})
			.addCase(registerTraveller.rejected, (state, action) => {
				state.status = 'failed'
				state.uploadProgress = null
				state.error = action.payload
			})

			// DELETE_TRAVELLER async thunk handlers
			.addCase(deleteTraveller.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(deleteTraveller.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.travellers = state.travellers.filter(
					(traveller) => traveller.id !== action.payload,
				)
				state.hasTravellers = state.travellers.length > 0
				if (state.selectedTraveller?.id === action.payload) {
					state.selectedTraveller = null
				}
			})
			.addCase(deleteTraveller.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// CHECK_IS_TRAVELLER async thunk handlers
			// A failed check keeps the last known value rather than hiding traveller-only features
			.addCase(checkIsTraveller.fulfilled, (state, action) => {
				state.isTraveller = action.payload
				state.isTravellerCheckedFor = action.meta.arg
				if (!action.payload) {
					state.travellerName = ''
				}
			})
			.addCase(checkIsTraveller.rejected, (state, action) => {
				state.isTravellerCheckedFor = action.meta.arg
			})

			// LOGOUT handlers
			// The flag is persisted, so it must not carry over to the next user in this browser
			.addMatcher(
				isAnyOf(
					authActions.clearUser,
					logout.fulfilled,
					logout.rejected,
				),
				(state) => {
					state.isTraveller = false
					state.isTravellerCheckedFor = null
					state.travellerName = ''
				},
			)
	},
})

export const selectTravellersState = (state) => state.travellers

export const selectTravellers = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.travellers,
)

export const selectLastFetch = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.lastFetch,
)

export const selectHasTravellers = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.hasTravellers,
)

export const selectIsTraveller = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.isTraveller,
)

export const selectIsTravellerCheckedFor = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.isTravellerCheckedFor,
)

// isTraveller starts false on a new device, so a negative answer means nothing until the login check resolves
export const selectIsTravellerKnown = createSelector(
	[selectIsTravellerCheckedFor, selectUserId],
	(isTravellerCheckedFor, userId) =>
		Boolean(userId) && isTravellerCheckedFor === userId,
)

export const selectTravellerName = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.travellerName,
)

export const selectSelectedTraveller = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.selectedTraveller,
)

export const selectTravellersStatus = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.status,
)

export const selectUploadProgress = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.uploadProgress,
)

export const selectTravellersError = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.error,
)

export const selectShouldUpdate = createSelector(
	[selectTravellersState],
	(travellersState) => shouldUpdate(travellersState),
)

export const {
	setTravellerName,
	setIsTraveller,
	setTravellers,
	setFetchTimestamp,
	setUploadProgress,
} = travellersSlice.actions
export default travellersSlice.reducer
