import {
	createSlice,
	createAsyncThunk,
	createSelector,
	isAnyOf,
} from '@reduxjs/toolkit'

import { MESSAGES_ACTION_TYPES } from '@/constants/redux'
import { API_DATABASE, API_ERROR_MESSAGE } from '@/constants/api'
import { ERROR_MESSAGES } from '@/constants/errors'
import { SENDER_STATUS } from '@/constants/travellers'

import {
	logout,
	selectAuthenticationToken,
	selectUserId,
} from './authenticationSlice'

import { databaseRequest } from '@/store/databaseRequest'

import { handleApiError } from '@/utils/errorHandler'

const isBlank = (value) => typeof value !== 'string' || value.trim() === ''

const initialState = {
	messages: [],
	status: 'idle',
	error: null,
}

export const contactTraveller = createAsyncThunk(
	MESSAGES_ACTION_TYPES.CONTACT_TRAVELLER,
	async ({ travellerId, message }, { getState, rejectWithValue }) => {
		if (isBlank(travellerId) || isBlank(message)) {
			return rejectWithValue(ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD)
		}

		try {
			const senderId = selectUserId(getState())
			const token = selectAuthenticationToken(getState())

			// The rules accept a message only from a signed-in traveller writing as themselves, so no email is stored
			const response = await databaseRequest(`/messages/${travellerId}`, {
				method: API_DATABASE.POST,
				token,
				body: {
					senderId,
					message,
					createdAt: API_DATABASE.SERVER_TIMESTAMP,
					read: false,
				},
			})

			const responseData = await response.json()

			return { id: responseData.name, travellerId, senderId, message }
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

const fullName = ({ firstName, lastName } = {}) =>
	[firstName, lastName].filter(Boolean).join(' ')

// The name is looked up, not stored, so it follows a renamed card and cannot be faked by the sender
const loadSender = async (senderId) => {
	try {
		const response = await databaseRequest(`/travellers/${senderId}`)
		const traveller = await response.json()

		return traveller
			? { status: SENDER_STATUS.TRAVELLER, name: fullName(traveller) }
			: { status: SENDER_STATUS.FORMER, name: null }
	} catch {
		return { status: SENDER_STATUS.UNKNOWN, name: null }
	}
}

const newestFirst = (a, b) => (b.createdAt ?? -1) - (a.createdAt ?? -1)

export const loadMessages = createAsyncThunk(
	MESSAGES_ACTION_TYPES.LOAD_MESSAGES,
	async (_, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = selectAuthenticationToken(getState())

			const response = await databaseRequest(`/messages/${userId}`, {
				token,
			})

			const responseData = await response.json()

			if (!responseData) {
				return []
			}

			const entries = Object.entries(responseData)
			const senderIds = [
				...new Set(
					entries.map(([, item]) => item.senderId).filter(Boolean),
				),
			]
			const senders = Object.fromEntries(
				await Promise.all(
					senderIds.map(async (id) => [id, await loadSender(id)]),
				),
			)

			return entries
				.map(([key, item]) => {
					const sender = item.senderId
						? senders[item.senderId]
						: { status: SENDER_STATUS.LEGACY, name: null }

					return {
						id: key,
						travellerId: userId,
						senderId: item.senderId ?? null,
						senderName: sender.name,
						senderStatus: sender.status,
						userEmail: item.userEmail ?? null,
						message: item.message,
						createdAt: item.createdAt ?? null,
						// Older messages have no read flag and count as read
						read: item.read !== false,
					}
				})
				.sort(newestFirst)
		} catch (error) {
			return rejectWithValue(
				handleApiError(error, API_ERROR_MESSAGE.LOAD_MESSAGES_CATCH),
			)
		}
	},
)

export const markMessagesRead = createAsyncThunk(
	MESSAGES_ACTION_TYPES.MARK_MESSAGES_READ,
	async (messageIds, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = selectAuthenticationToken(getState())

			await databaseRequest(`/messages/${userId}`, {
				method: API_DATABASE.PATCH,
				token,
				body: Object.fromEntries(
					messageIds.map((id) => [`${id}/read`, true]),
				),
			})

			return messageIds
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					API_ERROR_MESSAGE.MARK_MESSAGES_READ_CATCH,
				),
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

			await databaseRequest(`/messages/${userId}/${messageId}`, {
				method: API_DATABASE.DELETE,
				token,
			})

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

export const deleteTravellerMessages = createAsyncThunk(
	MESSAGES_ACTION_TYPES.DELETE_TRAVELLER_MESSAGES,
	async (travellerId, { getState, rejectWithValue }) => {
		try {
			const token = selectAuthenticationToken(getState())

			await databaseRequest(`/messages/${travellerId}`, {
				method: API_DATABASE.DELETE,
				token,
			})

			return travellerId
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_MESSAGES_CATCH}${travellerId}.`,
				),
			)
		}
	},
)

const setRead = (state, ids, read) => {
	state.messages.forEach((message) => {
		if (ids.includes(message.id)) message.read = read
	})
}

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

			// MARK_MESSAGES_READ async thunk handlers
			// The nav count drops at once; a failed write puts the flags back so the count is right next visit
			.addCase(markMessagesRead.pending, (state, action) => {
				setRead(state, action.meta.arg, true)
			})
			.addCase(markMessagesRead.rejected, (state, action) => {
				setRead(state, action.meta.arg, false)
			})

			// DELETE_MESSAGE async thunk handlers
			// Deletes run in the background after the Undo toast, so they leave the page's load status alone
			.addCase(deleteMessage.fulfilled, (state, action) => {
				state.messages = state.messages.filter(
					(message) => message.id !== action.payload,
				)
			})

			// LOGOUT async thunk handlers
			// The user is cleared before signOut can fail, so private messages must go either way
			.addMatcher(
				isAnyOf(logout.fulfilled, logout.rejected),
				() => initialState,
			)
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

export const selectUnreadMessagesCount = createSelector(
	[selectMessages],
	(messages) => messages.filter((message) => !message.read).length,
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
