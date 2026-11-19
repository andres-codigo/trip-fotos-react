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
	authActions,
	getSessionToken,
	logout,
	selectUserId,
} from './authenticationSlice'

import { databaseRequest } from '@/store/databaseRequest'

import { handleApiError } from '@/utils/errorHandler'
import { formatCity } from '@/utils/formatCity'
import { conversationId, otherMemberId, pushId } from '@/utils/conversationId'

const isBlank = (value) => typeof value !== 'string' || value.trim() === ''

const initialState = {
	conversations: [],
	legacyMessages: [],
	conversationsStatus: 'idle',
	conversationsError: null,
	threads: {},
}

const fullName = ({ firstName, lastName } = {}) =>
	[firstName, lastName].filter(Boolean).join(' ')

// The thread header names one place, the city without its country
const firstCity = (cities) =>
	cities?.[0] ? formatCity(cities[0]).split(',')[0] : null

// The name is looked up, not stored, so it follows a renamed card and cannot be faked by the sender
const loadSender = async (senderId, token) => {
	try {
		const response = await databaseRequest(`/travellers/${senderId}`, {
			token,
		})
		const traveller = await response.json()

		return traveller
			? {
					status: SENDER_STATUS.TRAVELLER,
					name: fullName(traveller),
					place: firstCity(traveller.cities),
				}
			: { status: SENDER_STATUS.FORMER, name: null, place: null }
	} catch {
		return { status: SENDER_STATUS.UNKNOWN, name: null, place: null }
	}
}

// Your side only: the other member keeps the conversation, and a reply to a former traveller is refused by the rules
export const deleteTravellerMessages = createAsyncThunk(
	MESSAGES_ACTION_TYPES.DELETE_TRAVELLER_MESSAGES,
	async (travellerId, { rejectWithValue }) => {
		try {
			const token = await getSessionToken()

			await databaseRequest('/', {
				method: API_DATABASE.PATCH,
				token,
				body: {
					[`userConversations/${travellerId}`]: null,
					[`legacyMessages/${travellerId}`]: null,
				},
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

const isUnread = (conversation, userId) =>
	!conversation.readPending &&
	conversation.lastSenderId !== userId &&
	conversation.lastAt > (conversation.readAt ?? 0)

const isCleared = ({ lastAt, clearedAt }) =>
	clearedAt != null && lastAt <= clearedAt

const loadSenders = async (ids, token) =>
	Object.fromEntries(
		await Promise.all(
			[...new Set(ids)].map(async (id) => [
				id,
				await loadSender(id, token),
			]),
		),
	)

export const loadConversations = createAsyncThunk(
	MESSAGES_ACTION_TYPES.LOAD_CONVERSATIONS,
	async (_, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = await getSessionToken()

			const [entries, legacy] = await Promise.all(
				[
					`/userConversations/${userId}`,
					`/legacyMessages/${userId}`,
				].map(
					async (path) =>
						(await (
							await databaseRequest(path, { token })
						).json()) ?? {},
				),
			)

			const visible = Object.entries(entries).filter(
				([, entry]) => !isCleared(entry),
			)
			const others = await loadSenders(
				visible.map(([, entry]) => entry.otherId),
				token,
			)

			return {
				conversations: visible
					.map(([id, entry]) => ({
						id,
						otherId: entry.otherId,
						otherName: others[entry.otherId].name,
						otherStatus: others[entry.otherId].status,
						otherPlace: others[entry.otherId].place,
						lastId: entry.lastId,
						lastMessage: entry.lastMessage,
						lastSenderId: entry.lastSenderId,
						lastAt: entry.lastAt,
						readAt: entry.readAt ?? null,
						clearedAt: entry.clearedAt ?? null,
					}))
					.sort((a, b) => b.lastAt - a.lastAt),
				legacyMessages: Object.entries(legacy).map(([id, item]) => ({
					id,
					userEmail: item.userEmail ?? null,
					message: item.message,
				})),
			}
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					API_ERROR_MESSAGE.LOAD_CONVERSATIONS_CATCH,
				),
			)
		}
	},
)

const findConversation = (state, cid) =>
	state.messages.conversations.find(({ id }) => id === cid)

export const loadThread = createAsyncThunk(
	MESSAGES_ACTION_TYPES.LOAD_THREAD,
	async (cid, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = await getSessionToken()
			const otherId = otherMemberId(cid, userId)
			const known = findConversation(getState(), cid)

			const [stored, other] = await Promise.all([
				databaseRequest(`/conversations/${cid}/messages`, {
					token,
				}).then((response) => response.json()),
				// A thread opened from a traveller's card may not be in the list yet
				known
					? {
							name: known.otherName,
							status: known.otherStatus,
							place: known.otherPlace,
						}
					: loadSender(otherId, token),
			])
			const clearedAt = known?.clearedAt ?? 0

			return {
				cid,
				otherId,
				otherName: other.name,
				otherStatus: other.status,
				otherPlace: other.place ?? null,
				messages: Object.entries(stored ?? {})
					.map(([id, item]) => ({
						id,
						senderId: item.senderId,
						message: item.message,
						createdAt: item.createdAt,
						status: 'sent',
					}))
					.filter(({ createdAt }) => createdAt > clearedAt)
					.sort((a, b) => a.createdAt - b.createdAt),
			}
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.LOAD_THREAD_CATCH}${cid}.`,
				),
			)
		}
	},
)

const summaryFor = (uid, cid, fields) =>
	Object.fromEntries(
		Object.entries(fields).map(([key, value]) => [
			`userConversations/${uid}/${cid}/${key}`,
			value,
		]),
	)

// The push id doubles as the request id, so the pending bubble and the stored message share it
export const sendMessage = createAsyncThunk(
	MESSAGES_ACTION_TYPES.SEND_MESSAGE,
	async ({ otherId, message }, { getState, requestId, rejectWithValue }) => {
		if (isBlank(otherId) || isBlank(message)) {
			return rejectWithValue(ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD)
		}

		try {
			const userId = selectUserId(getState())
			const token = await getSessionToken()
			const cid = conversationId(userId, otherId)
			const summary = {
				lastId: requestId,
				lastMessage: message,
				lastSenderId: userId,
				lastAt: API_DATABASE.SERVER_TIMESTAMP,
			}

			// One update, so the rules can check the summaries against the new message
			await databaseRequest('/', {
				method: API_DATABASE.PATCH,
				token,
				body: {
					[`conversations/${cid}/messages/${requestId}`]: {
						senderId: userId,
						message,
						createdAt: API_DATABASE.SERVER_TIMESTAMP,
					},
					...summaryFor(userId, cid, { otherId, ...summary }),
					...summaryFor(otherId, cid, {
						otherId: userId,
						...summary,
					}),
				},
			})

			return { cid, id: requestId }
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.SEND_MESSAGE_CATCH}${otherId}.`,
				),
			)
		}
	},
	{
		idGenerator: () => pushId(),
		getPendingMeta: (_, { getState }) => {
			const userId = selectUserId(getState())
			return { userId, sentAt: Date.now() }
		},
	},
)

const stampConversation = (cid, fields, token, userId) =>
	databaseRequest(`/userConversations/${userId}/${cid}`, {
		method: API_DATABASE.PATCH,
		token,
		body: fields,
	})

export const markConversationRead = createAsyncThunk(
	MESSAGES_ACTION_TYPES.MARK_CONVERSATION_READ,
	async (cid, { getState, rejectWithValue }) => {
		try {
			await stampConversation(
				cid,
				{ readAt: API_DATABASE.SERVER_TIMESTAMP },
				await getSessionToken(),
				selectUserId(getState()),
			)

			return cid
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.MARK_CONVERSATION_READ_CATCH}${cid}.`,
				),
			)
		}
	},
)

// Clears the thread for you only; the page holds it behind the Undo toast before dispatching
export const deleteConversation = createAsyncThunk(
	MESSAGES_ACTION_TYPES.DELETE_CONVERSATION,
	async (cid, { getState, rejectWithValue }) => {
		try {
			await stampConversation(
				cid,
				{
					readAt: API_DATABASE.SERVER_TIMESTAMP,
					clearedAt: API_DATABASE.SERVER_TIMESTAMP,
				},
				await getSessionToken(),
				selectUserId(getState()),
			)

			return cid
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.DELETE_CONVERSATION_CATCH}${cid}.`,
				),
			)
		}
	},
)

export const deleteLegacyMessage = createAsyncThunk(
	MESSAGES_ACTION_TYPES.DELETE_LEGACY_MESSAGE,
	async (id, { getState, rejectWithValue }) => {
		try {
			const userId = selectUserId(getState())
			const token = await getSessionToken()

			await databaseRequest(`/legacyMessages/${userId}/${id}`, {
				method: API_DATABASE.DELETE,
				token,
			})

			return id
		} catch (error) {
			return rejectWithValue(
				handleApiError(
					error,
					`${API_ERROR_MESSAGE.DELETE_LEGACY_MESSAGE_CATCH}${id}.`,
				),
			)
		}
	},
)

const threadMessage = (state, cid, id) =>
	state.threads[cid]?.messages.find((message) => message.id === id)

const messagesSlice = createSlice({
	name: 'messages',
	initialState,
	reducers: {
		dismissFailedMessage(state, action) {
			const { cid, id } = action.payload
			const thread = state.threads[cid]
			if (thread) {
				thread.messages = thread.messages.filter(
					(message) =>
						message.id !== id || message.status !== 'failed',
				)
			}
		},
	},
	extraReducers: (builder) => {
		builder
			// LOAD_CONVERSATIONS async thunk handlers
			.addCase(loadConversations.pending, (state) => {
				state.conversationsStatus = 'loading'
				state.conversationsError = null
			})
			.addCase(loadConversations.fulfilled, (state, action) => {
				state.conversationsStatus = 'succeeded'
				state.conversations = action.payload.conversations
				state.legacyMessages = action.payload.legacyMessages
			})
			.addCase(loadConversations.rejected, (state, action) => {
				state.conversationsStatus = 'failed'
				state.conversationsError = action.payload
			})

			// LOAD_THREAD async thunk handlers
			// Messages still sending or failed stay, so a reload under them does not lose them
			.addCase(loadThread.pending, (state, action) => {
				const thread = state.threads[action.meta.arg]
				state.threads[action.meta.arg] = {
					...thread,
					messages: thread?.messages ?? [],
					status: 'loading',
					error: null,
				}
			})
			.addCase(loadThread.fulfilled, (state, action) => {
				const { cid, messages, ...other } = action.payload
				const ids = new Set(messages.map(({ id }) => id))
				const unsent = state.threads[cid].messages.filter(
					(message) =>
						message.status !== 'sent' && !ids.has(message.id),
				)
				state.threads[cid] = {
					...other,
					messages: [...messages, ...unsent],
					status: 'succeeded',
					error: null,
				}
			})
			.addCase(loadThread.rejected, (state, action) => {
				state.threads[action.meta.arg].status = 'failed'
				state.threads[action.meta.arg].error = action.payload
			})

			// SEND_MESSAGE async thunk handlers
			// The bubble shows at once; a failed send keeps it, marked, for a retry
			.addCase(sendMessage.pending, (state, action) => {
				const { arg, requestId, userId, sentAt } = action.meta
				if (isBlank(arg.otherId) || isBlank(arg.message)) return
				const cid = conversationId(userId, arg.otherId)
				state.threads[cid] ??= {
					otherId: arg.otherId,
					messages: [],
					status: 'idle',
					error: null,
				}
				state.threads[cid].messages.push({
					id: requestId,
					senderId: userId,
					message: arg.message,
					createdAt: sentAt,
					status: 'sending',
				})
			})
			.addCase(sendMessage.fulfilled, (state, action) => {
				const { cid, id } = action.payload
				const sent = threadMessage(state, cid, id)
				if (!sent) return
				sent.status = 'sent'
				const conversation = state.conversations.find(
					(item) => item.id === cid,
				)
				const summary = {
					lastId: id,
					lastMessage: sent.message,
					lastSenderId: sent.senderId,
					lastAt: sent.createdAt,
				}
				if (conversation) {
					Object.assign(conversation, summary)
				} else {
					const thread = state.threads[cid]
					state.conversations.push({
						id: cid,
						otherId: thread.otherId,
						otherName: thread.otherName ?? null,
						otherStatus:
							thread.otherStatus ?? SENDER_STATUS.TRAVELLER,
						otherPlace: thread.otherPlace ?? null,
						readAt: null,
						clearedAt: null,
						...summary,
					})
				}
				state.conversations.sort((a, b) => b.lastAt - a.lastAt)
			})
			// Rejected actions carry no pending meta, so the bubble is found by its id alone
			.addCase(sendMessage.rejected, (state, action) => {
				const failed = Object.values(state.threads)
					.flatMap((thread) => thread.messages)
					.find((message) => message.id === action.meta.requestId)
				if (failed) failed.status = 'failed'
			})

			// MARK_CONVERSATION_READ async thunk handlers
			// The nav count drops at once; a failed write brings it back so the count is right next visit
			.addCase(markConversationRead.pending, (state, action) => {
				const conversation = state.conversations.find(
					({ id }) => id === action.meta.arg,
				)
				if (conversation) conversation.readPending = true
			})
			.addCase(markConversationRead.fulfilled, (state, action) => {
				const conversation = state.conversations.find(
					({ id }) => id === action.payload,
				)
				if (!conversation) return
				delete conversation.readPending
				// The server stamp is at least lastAt; the exact value is not read back
				conversation.readAt = Math.max(
					conversation.readAt ?? 0,
					conversation.lastAt,
				)
			})
			.addCase(markConversationRead.rejected, (state, action) => {
				const conversation = state.conversations.find(
					({ id }) => id === action.meta.arg,
				)
				if (conversation) delete conversation.readPending
			})

			// DELETE_CONVERSATION / DELETE_LEGACY_MESSAGE async thunk handlers
			// They run in the background after the Undo toast, so they leave the page's load status alone
			.addCase(deleteConversation.fulfilled, (state, action) => {
				state.conversations = state.conversations.filter(
					({ id }) => id !== action.payload,
				)
				delete state.threads[action.payload]
			})
			.addCase(deleteLegacyMessage.fulfilled, (state, action) => {
				state.legacyMessages = state.legacyMessages.filter(
					({ id }) => id !== action.payload,
				)
			})

			// A session can also end without logout (revoked, or signed out in another tab), and signOut can fail after the user is cleared, so private messages go in every case
			.addMatcher(
				isAnyOf(
					authActions.clearUser,
					logout.fulfilled,
					logout.rejected,
				),
				() => initialState,
			)
	},
})

const selectMessagesState = (state) => state.messages

export const { dismissFailedMessage } = messagesSlice.actions

export const selectConversations = createSelector(
	[selectMessagesState],
	(messagesState) => messagesState.conversations,
)

export const selectLegacyMessages = createSelector(
	[selectMessagesState],
	(messagesState) => messagesState.legacyMessages,
)

export const selectConversationsStatus = (state) =>
	state.messages.conversationsStatus

export const selectConversationsError = (state) =>
	state.messages.conversationsError

export const selectThread = (state, cid) => state.messages.threads[cid] ?? null

export const selectIsConversationUnread = (state, cid) => {
	const conversation = findConversation(state, cid)
	return Boolean(conversation) && isUnread(conversation, selectUserId(state))
}

export const selectUnreadConversationsCount = createSelector(
	[selectConversations, selectUserId],
	(conversations, userId) =>
		conversations.filter((conversation) => isUnread(conversation, userId))
			.length,
)

export default messagesSlice.reducer
