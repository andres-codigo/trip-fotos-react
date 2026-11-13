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
	uploadBytes,
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
import { GLOBAL } from '@/constants/ui'

import {
	authActions,
	logout,
	selectAuthenticationToken,
	selectUserId,
} from './authenticationSlice'
import { deleteTravellerMessages } from './messagesSlice'

import { databaseRequest } from '@/store/databaseRequest'

import { handleApiError } from '@/utils/errorHandler'
import { measureImage } from '@/utils/measureImage'
import { byNewestTrip, toPublicTrip } from '@/utils/publicTrip'
import { thumbnailUrlsOf } from '@/utils/tripPhotos'

// The database turns a sparse array into an object, so both shapes are read the same way
const thumbnailUrls = (fileThumbnails) =>
	Object.values(fileThumbnails ?? {}).flatMap(thumbnailUrlsOf)

// One multi-path update, so the public summary can never disagree with the trip it comes from
const saveTrip = (token, updates) =>
	databaseRequest('/', { method: API_DATABASE.PATCH, token, body: updates })

const shouldUpdate = (state) => {
	const lastFetch = state.lastFetch
	if (!lastFetch) {
		return true
	}
	const currentTimeStamp = new Date().getTime()
	return (currentTimeStamp - lastFetch) / 1000 > 60
}

// Every finished upload is pushed to uploadedRefs, so a failed save can remove the files it left behind
// An empty description is left out, so the record holds only what the traveller wrote
const altOf = (alt) => alt?.trim() || null

const uploadPhotos = async (files, { userId, dispatch, uploadedRefs }) => {
	const MAX_CONCURRENT_UPLOADS = 5
	const imageQueue = [...files]
	const imageUrls = []

	const totalFiles = imageQueue.length
	const fractions = new Array(totalFiles).fill(0)
	const fileDimensions = new Array(totalFiles).fill(null)
	const fileThumbnails = new Array(totalFiles).fill(null)
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
		dispatch(setUploadProgress({ uploadedFiles, totalFiles, percent }))
	}

	if (totalFiles > 0) reportProgress()

	// Best effort: a missing thumbnail only means the tile loads the full photo
	const uploadThumbnails = async (file, dimensions, pathFor, metadata) => {
		const storage = getFirebaseStorage()
		const aspect = dimensions
			? Math.max(dimensions.width, dimensions.height) /
				Math.min(dimensions.width, dimensions.height)
			: 1
		const results = await Promise.allSettled(
			GLOBAL.IMAGE_THUMBNAIL_WIDTHS.map(async (width) => {
				const thumbnail = await imageCompression(file, {
					maxWidthOrHeight: Math.round(width * aspect),
					useWebWorker: true,
				})
				const { ref: thumbnailRef } = await uploadBytes(
					ref(storage, pathFor(`${width}w-`)),
					thumbnail,
					metadata,
				)
				uploadedRefs.push(thumbnailRef)
				try {
					return {
						width,
						url: await getDownloadURL(thumbnailRef),
					}
				} catch (error) {
					// No saved URL points at it, so deleteTraveller could never remove it
					await deleteObject(thumbnailRef).catch(() => {})
					throw error
				}
			}),
		)
		return results
			.filter((result) => result.status === 'fulfilled')
			.map((result) => result.value)
	}

	let nextIndex = 0
	const uploadImage = async (image) => {
		const index = nextIndex++
		const storage = getFirebaseStorage()
		// Distinct files can share a name, and the same path would overwrite the earlier upload
		const id = crypto.randomUUID()
		const pathFor = (variant = '') =>
			`/images/${userId}/${id}-${variant}${image.name}`
		const storageRef = ref(storage, pathFor())

		const metadata = {
			customMetadata: {
				userId: userId,
			},
		}

		const compressedFile = await imageCompression(image.file || image, {
			maxSizeMB: 1,
			maxWidthOrHeight: 1920,
			useWebWorker: true,
		})

		fileDimensions[index] = await measureImage(compressedFile)

		const thumbnailsUpload = uploadThumbnails(
			compressedFile,
			fileDimensions[index],
			pathFor,
			metadata,
		)

		const uploadTask = uploadBytesResumable(
			storageRef,
			compressedFile,
			metadata,
		)

		const photoUpload = new Promise((resolve, reject) => {
			uploadTask.on(
				'state_changed',
				(snapshot) => {
					// A finished file is only counted once its download URL is in hand
					fractions[index] = Math.min(
						snapshot.bytesTransferred / (snapshot.totalBytes || 1),
						0.99,
					)
					reportProgress()
				},
				() => {
					reject(new Error(`Failed to upload image: ${image.name}`))
				},
				async () => {
					uploadedRefs.push(uploadTask.snapshot.ref)
					try {
						const url = await getDownloadURL(
							uploadTask.snapshot.ref,
						)
						fractions[index] = 1
						reportProgress()
						resolve(url)
					} catch (error) {
						reject(error)
					}
				},
			)
		})

		// Settling both means no thumbnail can land after a failed registration's cleanup
		const [photo, thumbnails] = await Promise.allSettled([
			photoUpload,
			thumbnailsUpload,
		])
		if (photo.status === 'rejected') throw photo.reason
		fileThumbnails[index] = thumbnails.value
		return photo.value
	}

	const uploadNextBatch = async () => {
		const batch = imageQueue.splice(0, MAX_CONCURRENT_UPLOADS)
		// Waiting for the whole batch to settle means no upload can land after the cleanup below
		const batchResults = await Promise.allSettled(batch.map(uploadImage))
		const failed = batchResults.find(
			(result) => result.status === 'rejected',
		)
		if (failed) throw failed.reason
		imageUrls.push(...batchResults.map((result) => result.value))
	}

	while (imageQueue.length > 0) {
		await uploadNextBatch()
	}

	return { urls: imageUrls, fileDimensions, fileThumbnails }
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

		// Every finished upload, so a failed registration can remove the files it left behind
		const uploadedRefs = []

		try {
			const {
				urls: imageUrls,
				fileDimensions,
				fileThumbnails,
			} = await uploadPhotos(data.files || [], {
				userId,
				dispatch,
				uploadedRefs,
			})

			const travellerData = {
				firstName: data.firstName,
				lastName: data.lastName,
				tripDescription: data.tripDescription,
				tripStart: data.tripStart,
				tripEnd: data.tripEnd,
				cities: data.cities,
				files: imageUrls,
				fileDimensions,
				fileThumbnails,
				fileAlts: (data.files || []).map(({ alt }) => altOf(alt)),
				registered: new Date().toISOString(),
			}

			try {
				await saveTrip(token, {
					[`travellers/${userId}`]: travellerData,
					[`publicTrips/${userId}`]: toPublicTrip(travellerData),
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
			// Best effort: the registration error is the one the user needs, and a retry uploads fresh copies
			await Promise.allSettled(
				uploadedRefs.map((uploadedRef) => deleteObject(uploadedRef)),
			)

			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${userId}.`,
				),
			)
		}
	},
)

export const updateTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.UPDATE_TRAVELLER,
	async (data, { getState, dispatch, rejectWithValue }) => {
		const userId = selectUserId(getState())
		const token = selectAuthenticationToken(getState())
		const keptPhotos = data.keptPhotos ?? []
		const removedPhotos = data.removedPhotos ?? []
		const uploadedRefs = []

		try {
			const uploaded = await uploadPhotos(data.files || [], {
				userId,
				dispatch,
				uploadedRefs,
			})

			const changes = {
				firstName: data.firstName,
				lastName: data.lastName,
				tripDescription: data.tripDescription,
				tripStart: data.tripStart,
				tripEnd: data.tripEnd,
				// The trip dates replace the length an older record stored
				daysInCity: null,
				cities: data.cities,
				files: [...keptPhotos.map(({ url }) => url), ...uploaded.urls],
				fileDimensions: [
					...keptPhotos.map(({ dimensions }) => dimensions),
					...uploaded.fileDimensions,
				],
				fileThumbnails: [
					...keptPhotos.map(({ thumbnails }) => thumbnails),
					...uploaded.fileThumbnails,
				],
				fileAlts: [
					...keptPhotos.map(({ alt }) => altOf(alt)),
					...(data.files || []).map(({ alt }) => altOf(alt)),
				],
			}

			try {
				await saveTrip(token, {
					...Object.fromEntries(
						Object.entries(changes).map(([field, value]) => [
							`travellers/${userId}/${field}`,
							value,
						]),
					),
					[`publicTrips/${userId}`]: toPublicTrip(changes),
				})
			} catch {
				throw new Error(ERROR_MESSAGES.FAILED_TO_SAVE_TRIP)
			}

			// Removed only once the record no longer points at them; one that fails is left behind, never shown
			const storage = getFirebaseStorage()
			await Promise.allSettled(
				removedPhotos
					.flatMap(({ url, thumbnails }) => [
						url,
						...thumbnailUrlsOf(thumbnails),
					])
					.map((url) => deleteObject(ref(storage, url))),
			)

			// The record is already saved, so a failed name update must not report the save as failed
			await dispatch(
				travellerName({ first: data.firstName, last: data.lastName }),
			)

			const saved = {
				...getState().travellers.selectedTraveller,
				...changes,
				id: userId,
			}
			delete saved.daysInCity
			return saved
		} catch (error) {
			// Best effort: the record still points at the old photos, so only this attempt's uploads go
			await Promise.allSettled(
				uploadedRefs.map((uploadedRef) => deleteObject(uploadedRef)),
			)

			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_CATCH}${userId}.`,
				),
			)
		}
	},
)

export const updateTravellers = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.UPDATE_TRAVELLERS,
	async (_, { getState, rejectWithValue, dispatch }) => {
		try {
			const response = await databaseRequest('/travellers', {
				token: selectAuthenticationToken(getState()),
			})

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
				tripDescription: responseData[key].tripDescription,
				tripStart: responseData[key].tripStart,
				tripEnd: responseData[key].tripEnd,
				daysInCity: responseData[key].daysInCity,
				cities: responseData[key].cities,
				files: responseData[key].files,
				fileDimensions: responseData[key].fileDimensions,
				fileThumbnails: responseData[key].fileThumbnails,
				fileAlts: responseData[key].fileAlts,
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
	async (travellerId, { getState, rejectWithValue }) => {
		try {
			const response = await databaseRequest(
				`/travellers/${travellerId}`,
				{
					token: selectAuthenticationToken(getState()),
				},
			)

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

// The Auth display name can be missing (a failed name update at registration), so the nav takes the name from the record
const loadOwnName = async (userId, token, dispatch) => {
	try {
		const [firstName, lastName] = await Promise.all(
			['firstName', 'lastName'].map(async (field) =>
				(
					await databaseRequest(`/travellers/${userId}/${field}`, {
						token,
					})
				).json(),
			),
		)
		if (firstName && lastName) {
			dispatch(setTravellerName(`${firstName} ${lastName}`))
		}
	} catch {
		// The name is only shown in the nav, so failing to read it must not fail the traveller check
	}
}

export const checkIsTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.CHECK_IS_TRAVELLER,
	async (userId, { getState, dispatch, rejectWithValue }) => {
		try {
			const token = selectAuthenticationToken(getState())
			// shallow avoids downloading the whole record just to test it exists
			const response = await databaseRequest(`/travellers/${userId}`, {
				token,
				params: { shallow: true },
			})

			const responseData = await response.json()

			if (responseData !== null) {
				await loadOwnName(userId, token, dispatch)
			}

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

// Logged-out visitors read the public summaries only; the full records need sign-in
export const loadPublicTrips = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.LOAD_PUBLIC_TRIPS,
	async (_, { rejectWithValue }) => {
		try {
			const response = await databaseRequest('/publicTrips')
			const responseData = await response.json()

			return Object.entries(responseData ?? {})
				.map(([id, trip]) => ({ ...trip, id }))
				.sort(byNewestTrip)
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					API_ERROR_MESSAGE.LOAD_PUBLIC_TRIPS_CATCH,
				),
			)
		}
	},
)

export const deleteTraveller = createAsyncThunk(
	TRAVELLERS_ACTION_TYPES.DELETE_TRAVELLER,
	async (
		{ travellerId, files = [], fileThumbnails },
		{ getState, dispatch, rejectWithValue },
	) => {
		try {
			const token = selectAuthenticationToken(getState())

			await saveTrip(token, {
				[`travellers/${travellerId}`]: null,
				[`publicTrips/${travellerId}`]: null,
			})

			const storage = getFirebaseStorage()
			await Promise.all(
				[...files, ...thumbnailUrls(fileThumbnails)].map(
					async (fileUrl) => {
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
					},
				),
			)

			await dispatch(deleteTravellerMessages(travellerId)).unwrap()
			// Deleting your own profile leaves you signed in, but no longer a traveller
			if (travellerId === selectUserId(getState())) {
				dispatch(setIsTraveller(false))
				dispatch(setTravellerName(''))
			}
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
		publicTrips: [],
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

			// UPDATE_TRAVELLER async thunk handlers
			.addCase(updateTraveller.pending, (state) => {
				state.status = 'loading'
				state.uploadProgress = null
			})
			.addCase(updateTraveller.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.uploadProgress = null
				state.selectedTraveller = action.payload
				state.travellers = state.travellers.map((traveller) =>
					traveller.id === action.payload.id
						? action.payload
						: traveller,
				)
				state.travellerName = `${action.payload.firstName} ${action.payload.lastName}`
			})
			.addCase(updateTraveller.rejected, (state, action) => {
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

			.addCase(loadPublicTrips.fulfilled, (state, action) => {
				state.publicTrips = action.payload
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
					state.selectedTraveller = null
					// The full records need sign-in, so they must not stay in this browser's storage
					state.travellers = []
					state.hasTravellers = false
					state.lastFetch = null
				},
			)
	},
})

export const selectTravellersState = (state) => state.travellers

export const selectTravellers = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.travellers,
)

// One empty list, so a store persisted before publicTrips existed does not re-render every reader
const NO_PUBLIC_TRIPS = []
export const selectPublicTrips = (state) =>
	state.travellers.publicTrips ?? NO_PUBLIC_TRIPS

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
