import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import imageCompression from 'browser-image-compression'
import {
	getStorage,
	getDownloadURL,
	ref,
	uploadBytesResumable,
} from 'firebase/storage'

import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import {
	API_DATABASE,
	API_ERROR_MESSAGE,
	COMMON_HEADERS,
} from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

import { selectAuthenticationToken } from './authenticationSlice'

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
	async (data, { getState, rejectWithValue, dispatch }) => {
		const fullName = `${data.first} ${data.last}`

		try {
			const token = selectAuthenticationToken(getState())

			const response = await fetch(
				`${API_DATABASE.URL}update?key=${API_DATABASE.KEY}`,
				{
					method: API_DATABASE.POST,
					headers: COMMON_HEADERS.JSON,
					body: JSON.stringify({
						idToken: token,
						displayName: fullName,
					}),
				},
			)

			const updateResponse = await response.json()

			if (!response.ok) {
				return rejectWithValue(
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME_CATCH}${fullName}.`,
				)
			}

			localStorage.setItem('userName', updateResponse.displayName)
			dispatch(setTravellerName(updateResponse.displayName))
			return updateResponse.displayName
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
	async (data, { getState, rejectWithValue }) => {
		const userId = localStorage.getItem('userId')
		const token = selectAuthenticationToken(getState())

		try {
			const MAX_CONCURRENT_UPLOADS = 5
			const imageQueue = [...(data.files || [])]
			const imageUrls = []

			const uploadImage = async (image) => {
				const storage = getStorage()
				const storageRef = ref(
					storage,
					`/images/${userId}/${image.name}`,
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
						null,
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

			const response = await fetch(
				`${API_DATABASE.BASE_URL}/travellers/${userId}.json?auth=${token}`,
				{
					method: API_DATABASE.PUT,
					headers: COMMON_HEADERS.JSON,
					body: JSON.stringify(travellerData),
				},
			)

			if (!response.ok) {
				throw new Error(
					`${API_ERROR_MESSAGE.REGISTER_TRAVELLER_CATCH}${userId}.`,
				)
			}

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
	async (_, { rejectWithValue, dispatch }) => {
		try {
			const response = await fetch(
				`${API_DATABASE.BASE_URL}/travellers.json`,
				{
					method: API_DATABASE.GET,
					headers: COMMON_HEADERS.JSON,
				},
			)

			if (!response.ok) {
				throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
			}

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

			const userId = localStorage.getItem('userId')
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
				return travellers
			}
		} catch (error) {
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
			const response = await fetch(
				`${API_DATABASE.BASE_URL}/travellers/${travellerId}.json`,
				{
					method: API_DATABASE.GET,
					headers: COMMON_HEADERS.JSON,
				},
			)

			if (!response.ok) {
				throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
			}

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

const travellersSlice = createSlice({
	name: 'travellers',
	initialState: {
		travellerName: '',
		isTraveller: false,
		hasTravellers: false,
		travellers: [],
		selectedTraveller: null,
		lastFetch: null,
		status: 'idle',
		error: null,
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
			})

			// REGISTER_TRAVELLER async thunk handlers
			.addCase(registerTraveller.pending, (state) => {
				state.status = 'loading'
			})
			.addCase(registerTraveller.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.travellers.unshift(action.payload)
				state.isTraveller = true
				state.hasTravellers = true
				state.travellerName = `${action.payload.firstName} ${action.payload.lastName}`
			})
			.addCase(registerTraveller.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})
	},
})

export const selectTravellersState = (state) => state.travellers

export const selectTravellers = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.travellers,
)

export const selectHasTravellers = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.hasTravellers,
)

export const selectIsTraveller = createSelector(
	[selectTravellersState],
	(travellersState) => travellersState.isTraveller,
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
} = travellersSlice.actions
export default travellersSlice.reducer
