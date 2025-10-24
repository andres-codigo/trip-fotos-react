import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'

import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import {
	API_DATABASE,
	API_ERROR_MESSAGE,
	COMMON_HEADERS,
} from '@/constants/api'
import { ERROR_MESSAGES, ERROR_TYPES } from '@/constants/errors'

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
					`${API_ERROR_MESSAGE.UPDATE_TRAVELLER_NAME}${fullName}.`,
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
				if (response.status === 500) {
					return rejectWithValue(ERROR_MESSAGES.SERVER_ERROR)
				} else if (response.status === 404) {
					return rejectWithValue(ERROR_MESSAGES.DATA_NOT_FOUND)
				} else if (response.status >= 400 && response.status < 500) {
					return rejectWithValue(ERROR_MESSAGES.REQUEST_ERROR)
				} else {
					return rejectWithValue(ERROR_MESSAGES.CONNECTION_ERROR)
				}
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
				areas: responseData[key].areas,
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
			if (
				error.name === ERROR_TYPES.TYPE_ERROR &&
				error.message.includes(ERROR_MESSAGES.FAILED_TO_FETCH)
			) {
				return rejectWithValue(ERROR_MESSAGES.NETWORK_CONNECTION_ERROR)
			}

			return rejectWithValue(ERROR_MESSAGES.UNEXPECTED_ERROR)
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
			return rejectWithValue(error || ERROR_MESSAGES.REFRESH_ERROR)
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
