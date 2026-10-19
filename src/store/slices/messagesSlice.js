import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'

import { MESSAGES_ACTION_TYPES } from '@/constants/redux'
import {
	API_DATABASE,
	API_ERROR_MESSAGE,
	COMMON_HEADERS,
} from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'

import {
	logout,
	selectAuthenticationToken,
	selectUserId,
} from './authenticationSlice'

import { handleApiError } from '@/utils/errorHandler'

const isBlank = (value) => typeof value !== 'string' || value.trim() === ''

const initialState = {
	messages: [],
	status: 'idle',
	error: null,
}

export const contactTraveller = createAsyncThunk(
	MESSAGES_ACTION_TYPES.CONTACT_TRAVELLER,
	async ({ travellerId, email, message }, { rejectWithValue }) => {
		if (isBlank(travellerId) || isBlank(email) || isBlank(message)) {
			return rejectWithValue(ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD)
		}

		try {
			const response = await fetch(
				`${API_DATABASE.BASE_URL}/messages/${travellerId}.json`,
				{
					method: API_DATABASE.POST,
					headers: COMMON_HEADERS.JSON,
					body: JSON.stringify({ userEmail: email, message }),
				},
			)

			if (!response.ok) {
				throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
			}

			const responseData = await response.json()

			return {
				id: responseData.name,
				travellerId,
				userEmail: email,
				message,
			}
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.CONTACT_TRAVELLER_CATCH}${travellerId}.`,
				),
			)
		}
	},
)

export const loadMessages = createAsyncThunk(
	MESSAGES_ACTION_TYPES.LOAD_MESSAGES,
	async (_, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = selectAuthenticationToken(getState())

			const response = await fetch(
				`${API_DATABASE.BASE_URL}/messages/${userId}.json?auth=${token}`,
				{
					method: API_DATABASE.GET,
					headers: COMMON_HEADERS.JSON,
				},
			)

			if (!response.ok) {
				throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
			}

			const responseData = await response.json()

			if (!responseData) {
				return []
			}

			return Object.keys(responseData).map((key) => ({
				id: key,
				travellerId: userId,
				userEmail: responseData[key].userEmail,
				message: responseData[key].message,
			}))
		} catch (error) {
			return rejectWithValue(
				handleApiError(error, API_ERROR_MESSAGE.LOAD_MESSAGES_CATCH),
			)
		}
	},
)

export const deleteMessage = createAsyncThunk(
	MESSAGES_ACTION_TYPES.DELETE_MESSAGE,
	async (messageId, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = selectAuthenticationToken(getState())

			const response = await fetch(
				`${API_DATABASE.BASE_URL}/messages/${userId}/${messageId}.json?auth=${token}`,
				{
					method: API_DATABASE.DELETE,
					headers: COMMON_HEADERS.JSON,
				},
			)

			if (!response.ok) {
				throw new Error(ERROR_MESSAGES.REQUEST_ERROR)
			}

			return messageId
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.DELETE_MESSAGE_CATCH}${messageId}.`,
				),
			)
		}
	},
)

const messagesSlice = createSlice({
	name: 'messages',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			// CONTACT_TRAVELLER async thunk handlers
			.addCase(contactTraveller.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(contactTraveller.fulfilled, (state) => {
				// The sender is not the recipient, so the message is not added to the local list
				state.status = 'succeeded'
			})
			.addCase(contactTraveller.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// LOAD_MESSAGES async thunk handlers
			.addCase(loadMessages.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(loadMessages.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.messages = action.payload
			})
			.addCase(loadMessages.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// DELETE_MESSAGE async thunk handlers
			.addCase(deleteMessage.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(deleteMessage.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.messages = state.messages.filter(
					(message) => message.id !== action.payload,
				)
			})
			.addCase(deleteMessage.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload
			})

			// LOGOUT async thunk handlers
			.addCase(logout.fulfilled, () => initialState)
	},
})

export const selectMessagesState = (state) => state.messages

export const selectMessages = createSelector(
	[selectMessagesState],
	(messagesState) => messagesState.messages,
)

export const selectHasMessages = createSelector(
	[selectMessages],
	(messages) => messages.length > 0,
)

export const selectMessagesCount = createSelector(
	[selectMessages],
	(messages) => messages.length,
)

export const selectMessagesStatus = createSelector(
	[selectMessagesState],
	(messagesState) => messagesState.status,
)

export const selectMessagesError = createSelector(
	[selectMessagesState],
	(messagesState) => messagesState.error,
)

export default messagesSlice.reducer
