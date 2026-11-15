import { describe, it, expect, beforeEach, vi } from 'vitest'
import configureTestStore from '@/testUtils/configureTestStore'

import { MOCK_USER, MOCK_THREADS } from '@/constants/test'
import { ERROR_MESSAGES } from '@/constants/errors'
import { API_DATABASE, API_ERROR_MESSAGE } from '@/constants/api'
import { SENDER_STATUS } from '@/constants/travellers'

import messagesReducer, {
	loadConversations,
	loadThread,
	sendMessage,
	markConversationRead,
	deleteConversation,
	deleteLegacyMessage,
	deleteTravellerMessages,
	dismissFailedMessage,
	selectConversations,
	selectLegacyMessages,
	selectConversationsStatus,
	selectConversationsError,
	selectThread,
	selectIsConversationUnread,
	selectUnreadConversationsCount,
} from './messagesSlice'

import { logout } from './authenticationSlice'

vi.mock('@/utils/errorHandler', () => ({
	handleApiError: vi.fn((error, message) => `${message}: ${error?.message}`),
}))

vi.mock('./authenticationSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit')
	return {
		selectAuthenticationToken: vi.fn(() => MOCK_USER.TOKEN),
		selectUserId: vi.fn(() => MOCK_USER.USER_ID),
		logout: createAsyncThunk('authentication/logout', async () => {}),
	}
})

const ME = MOCK_USER.USER_ID
const { OTHER_ID, FORMER_ID, LEGACY } = MOCK_THREADS
const cidWith = (other) => [ME, other].sort().join('_')
const CID = cidWith(OTHER_ID)
const FORMER_CID = cidWith(FORMER_ID)
const CLEARED_CID = cidWith('mock-cleared-id')

const NOW = 1794290000000
const stored = MOCK_THREADS.TWO_SIDED.map(
	({ id, fromOther, message, ago }) => ({
		id,
		senderId: fromOther ? OTHER_ID : ME,
		message,
		createdAt: NOW - ago,
	}),
)
const last = stored.at(-1)

const DB = Object.freeze({
	userConversations: {
		[CID]: {
			otherId: OTHER_ID,
			lastId: last.id,
			lastMessage: last.message,
			lastSenderId: OTHER_ID,
			lastAt: last.createdAt,
		},
		[FORMER_CID]: {
			otherId: FORMER_ID,
			lastId: 'former-last',
			lastMessage: 'Old news',
			lastSenderId: FORMER_ID,
			lastAt: NOW - 100000000,
			readAt: NOW - 100000000,
		},
		// Cleared after its last message, so it stays hidden
		[CLEARED_CID]: {
			otherId: 'mock-cleared-id',
			lastId: 'cleared-last',
			lastMessage: 'Gone',
			lastSenderId: 'mock-cleared-id',
			lastAt: NOW - 5000,
			clearedAt: NOW - 1000,
		},
	},
	legacyMessages: {
		[LEGACY.id]: { userEmail: LEGACY.userEmail, message: LEGACY.message },
	},
	messages: Object.fromEntries(stored.map(({ id, ...item }) => [id, item])),
	travellers: { [OTHER_ID]: { firstName: 'Jane', lastName: 'Smith' } },
})

const okJson = (data) => ({ ok: true, json: async () => data })

// Answers each read by its path, so the order of requests does not matter
const mockDatabase = ({ failing } = {}) =>
	fetch.mockImplementation(async (url, options = {}) => {
		const path = new URL(url).pathname.replace(/\.json$/, '')
		if (failing && path.includes(failing)) return { ok: false, status: 500 }
		if (options.method && options.method !== 'GET') return okJson(null)
		if (path === `/userConversations/${ME}`)
			return okJson(DB.userConversations)
		if (path === `/legacyMessages/${ME}`) return okJson(DB.legacyMessages)
		if (path === `/conversations/${CID}/messages`)
			return okJson(DB.messages)
		const traveller = path.match(/^\/travellers\/(.+)$/)
		if (traveller) return okJson(DB.travellers[traveller[1]] ?? null)
		throw new Error(`Unexpected request: ${url}`)
	})

const writes = () =>
	fetch.mock.calls
		.filter(([, options]) => options?.method && options.method !== 'GET')
		.map(([url, options]) => ({
			path: new URL(url).pathname,
			method: options.method,
			body: options.body && JSON.parse(options.body),
		}))

let store

beforeEach(() => {
	store = configureTestStore({ reducer: { messages: messagesReducer } })
	vi.clearAllMocks()
	if (!vi.isMockFunction(global.fetch)) global.fetch = vi.fn()
	fetch.mockReset()
	mockDatabase()
})

const conversation = (cid) =>
	selectConversations(store.getState()).find(({ id }) => id === cid)

describe('messagesSlice', () => {
	describe('initial state', () => {
		it('starts with no conversations, legacy messages or threads', () => {
			expect(store.getState().messages).toEqual({
				conversations: [],
				legacyMessages: [],
				conversationsStatus: 'idle',
				conversationsError: null,
				threads: {},
			})
		})
	})

	describe('loadConversations', () => {
		describe('success scenarios', () => {
			it('lists the visible conversations newest first, with the other member looked up', async () => {
				await store.dispatch(loadConversations())

				const conversations = selectConversations(store.getState())
				expect(conversations.map(({ id }) => id)).toEqual([
					CID,
					FORMER_CID,
				])
				expect(conversations[0]).toMatchObject({
					otherId: OTHER_ID,
					otherName: 'Jane Smith',
					otherStatus: SENDER_STATUS.TRAVELLER,
					lastMessage: last.message,
					readAt: null,
				})
				expect(conversations[1].otherStatus).toBe(SENDER_STATUS.FORMER)
				expect(selectConversationsStatus(store.getState())).toBe(
					'succeeded',
				)
			})

			it('loads the email-only messages apart from the conversations', async () => {
				await store.dispatch(loadConversations())

				expect(selectLegacyMessages(store.getState())).toEqual([
					{
						id: LEGACY.id,
						userEmail: LEGACY.userEmail,
						message: LEGACY.message,
					},
				])
			})

			it('counts a conversation the other member wrote in since it was read as unread', async () => {
				await store.dispatch(loadConversations())

				expect(selectUnreadConversationsCount(store.getState())).toBe(1)
				expect(selectIsConversationUnread(store.getState(), CID)).toBe(
					true,
				)
				expect(
					selectIsConversationUnread(store.getState(), FORMER_CID),
				).toBe(false)
			})

			it('treats an empty inbox as no conversations', async () => {
				fetch.mockImplementation(async () => okJson(null))

				await store.dispatch(loadConversations())

				expect(selectConversations(store.getState())).toEqual([])
				expect(selectLegacyMessages(store.getState())).toEqual([])
			})
		})

		describe('failure scenarios', () => {
			it('sets the error when the list cannot be read', async () => {
				mockDatabase({ failing: '/userConversations/' })

				await store.dispatch(loadConversations())

				expect(selectConversationsStatus(store.getState())).toBe(
					'failed',
				)
				expect(selectConversationsError(store.getState())).toContain(
					API_ERROR_MESSAGE.LOAD_CONVERSATIONS_CATCH,
				)
			})
		})
	})

	describe('loadThread', () => {
		describe('success scenarios', () => {
			it('loads the messages oldest first, with the other member from the list', async () => {
				await store.dispatch(loadConversations())
				fetch.mockClear()

				await store.dispatch(loadThread(CID))

				const thread = selectThread(store.getState(), CID)
				expect(thread.status).toBe('succeeded')
				expect(thread.otherName).toBe('Jane Smith')
				expect(thread.messages.map(({ id }) => id)).toEqual(
					stored.map(({ id }) => id),
				)
				expect(
					fetch.mock.calls.some(([url]) =>
						url.includes('/travellers/'),
					),
				).toBe(false)
			})

			it('looks the other member up when the conversation is not listed yet', async () => {
				await store.dispatch(loadThread(CID))

				expect(selectThread(store.getState(), CID)).toMatchObject({
					otherId: OTHER_ID,
					otherName: 'Jane Smith',
					otherStatus: SENDER_STATUS.TRAVELLER,
				})
			})
		})

		describe('failure scenarios', () => {
			it('sets the thread error when the messages cannot be read', async () => {
				mockDatabase({ failing: '/conversations/' })

				await store.dispatch(loadThread(CID))

				const thread = selectThread(store.getState(), CID)
				expect(thread.status).toBe('failed')
				expect(thread.error).toContain(
					API_ERROR_MESSAGE.LOAD_THREAD_CATCH,
				)
			})
		})
	})

	describe('sendMessage', () => {
		const payload = { otherId: OTHER_ID, message: 'See you in Porto!' }

		describe('success scenarios', () => {
			it('writes the message and both summaries in one authorised update, keyed by a push id', async () => {
				const result = await store.dispatch(sendMessage(payload))

				expect(result.meta.requestStatus).toBe('fulfilled')
				const id = result.payload.id
				expect(id).toMatch(/^[-0-9A-Za-z_]{20}$/)
				const [write] = writes()
				expect(write.path).toBe('/.json')
				expect(write.method).toBe('PATCH')
				const summary = {
					lastId: id,
					lastMessage: payload.message,
					lastSenderId: ME,
					lastAt: API_DATABASE.SERVER_TIMESTAMP,
				}
				expect(write.body).toEqual({
					[`conversations/${CID}/messages/${id}`]: {
						senderId: ME,
						message: payload.message,
						createdAt: API_DATABASE.SERVER_TIMESTAMP,
					},
					...Object.fromEntries(
						Object.entries({ otherId: OTHER_ID, ...summary }).map(
							([key, value]) => [
								`userConversations/${ME}/${CID}/${key}`,
								value,
							],
						),
					),
					...Object.fromEntries(
						Object.entries({ otherId: ME, ...summary }).map(
							([key, value]) => [
								`userConversations/${OTHER_ID}/${CID}/${key}`,
								value,
							],
						),
					),
				})
			})

			it('shows the message at once as sending, then sent', async () => {
				let release
				fetch.mockImplementationOnce(
					() => new Promise((resolve) => (release = resolve)),
				)

				const sending = store.dispatch(sendMessage(payload))
				const pending = selectThread(store.getState(), CID).messages
				expect(pending).toEqual([
					expect.objectContaining({
						senderId: ME,
						message: payload.message,
						status: 'sending',
					}),
				])

				release({ ok: true })
				await sending

				expect(
					selectThread(store.getState(), CID).messages[0].status,
				).toBe('sent')
			})

			it('moves the conversation to the top of the list with the new message', async () => {
				await store.dispatch(loadConversations())
				await store.dispatch(
					sendMessage({ otherId: FORMER_ID, message: 'Hi' }),
				)

				const [first] = selectConversations(store.getState())
				expect(first).toMatchObject({
					id: FORMER_CID,
					lastMessage: 'Hi',
					lastSenderId: ME,
				})
			})

			it('adds a new conversation to the list', async () => {
				await store.dispatch(loadThread(CID))
				await store.dispatch(sendMessage(payload))

				expect(conversation(CID)).toMatchObject({
					otherId: OTHER_ID,
					otherName: 'Jane Smith',
					lastMessage: payload.message,
				})
			})
		})

		describe('failure scenarios', () => {
			it('keeps a failed message, marked, until it is dismissed', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 403 })

				const result = await store.dispatch(sendMessage(payload))

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.SEND_MESSAGE_CATCH}${OTHER_ID}`,
				)
				const [failed] = selectThread(store.getState(), CID).messages
				expect(failed.status).toBe('failed')

				store.dispatch(
					dismissFailedMessage({ cid: CID, id: failed.id }),
				)

				expect(selectThread(store.getState(), CID).messages).toEqual([])
			})

			it('keeps a message still sending when the thread reloads under it', async () => {
				fetch.mockImplementationOnce(() => new Promise(() => {}))
				store.dispatch(sendMessage(payload))

				await store.dispatch(loadThread(CID))

				const messages = selectThread(store.getState(), CID).messages
				expect(messages.at(-1)).toMatchObject({
					message: payload.message,
					status: 'sending',
				})
				expect(messages).toHaveLength(stored.length + 1)
			})

			it.each([
				['an empty message', { otherId: OTHER_ID, message: '  ' }],
				['no recipient', { otherId: '', message: 'Hi' }],
			])('rejects %s without writing or showing it', async (_, arg) => {
				const result = await store.dispatch(sendMessage(arg))

				expect(result.payload).toBe(
					ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD,
				)
				expect(fetch).not.toHaveBeenCalled()
				expect(store.getState().messages.threads).toEqual({})
			})
		})
	})

	describe('markConversationRead', () => {
		describe('success scenarios', () => {
			it('stamps readAt for the signed-in member only', async () => {
				await store.dispatch(loadConversations())
				fetch.mockClear()

				await store.dispatch(markConversationRead(CID))

				expect(writes()).toEqual([
					{
						path: `/userConversations/${ME}/${CID}.json`,
						method: 'PATCH',
						body: { readAt: API_DATABASE.SERVER_TIMESTAMP },
					},
				])
				expect(selectUnreadConversationsCount(store.getState())).toBe(0)
			})

			it('drops the unread count before the write returns', async () => {
				await store.dispatch(loadConversations())
				fetch.mockImplementationOnce(() => new Promise(() => {}))

				store.dispatch(markConversationRead(CID))

				expect(selectUnreadConversationsCount(store.getState())).toBe(0)
			})
		})

		describe('failure scenarios', () => {
			it('brings the unread count back when the write fails', async () => {
				await store.dispatch(loadConversations())
				fetch.mockResolvedValueOnce({ ok: false, status: 500 })

				const result = await store.dispatch(markConversationRead(CID))

				expect(result.payload).toContain(
					API_ERROR_MESSAGE.MARK_CONVERSATION_READ_CATCH,
				)
				expect(selectUnreadConversationsCount(store.getState())).toBe(1)
			})
		})
	})

	describe('deleteConversation', () => {
		describe('success scenarios', () => {
			it('clears the conversation for the signed-in member and drops it from the list', async () => {
				await store.dispatch(loadConversations())
				await store.dispatch(loadThread(CID))
				fetch.mockClear()

				await store.dispatch(deleteConversation(CID))

				expect(writes()).toEqual([
					{
						path: `/userConversations/${ME}/${CID}.json`,
						method: 'PATCH',
						body: {
							readAt: API_DATABASE.SERVER_TIMESTAMP,
							clearedAt: API_DATABASE.SERVER_TIMESTAMP,
						},
					},
				])
				expect(conversation(CID)).toBeUndefined()
				expect(selectThread(store.getState(), CID)).toBeNull()
			})
		})

		describe('failure scenarios', () => {
			it('keeps the conversation when the write fails', async () => {
				await store.dispatch(loadConversations())
				fetch.mockResolvedValueOnce({ ok: false, status: 500 })

				const result = await store.dispatch(deleteConversation(CID))

				expect(result.payload).toContain(
					API_ERROR_MESSAGE.DELETE_CONVERSATION_CATCH,
				)
				expect(conversation(CID)).toBeDefined()
			})
		})
	})

	describe('deleteLegacyMessage', () => {
		it('deletes the email-only message and drops it from the list', async () => {
			await store.dispatch(loadConversations())
			fetch.mockClear()

			await store.dispatch(deleteLegacyMessage(LEGACY.id))

			expect(writes()).toEqual([
				{
					path: `/legacyMessages/${ME}/${LEGACY.id}.json`,
					method: 'DELETE',
					body: undefined,
				},
			])
			expect(selectLegacyMessages(store.getState())).toEqual([])
		})

		it('keeps the message when the delete fails', async () => {
			await store.dispatch(loadConversations())
			fetch.mockResolvedValueOnce({ ok: false, status: 500 })

			const result = await store.dispatch(deleteLegacyMessage(LEGACY.id))

			expect(result.payload).toContain(
				API_ERROR_MESSAGE.DELETE_LEGACY_MESSAGE_CATCH,
			)
			expect(selectLegacyMessages(store.getState())).toHaveLength(1)
		})
	})

	describe('logout', () => {
		it('clears conversations and threads so they do not leak between users', async () => {
			await store.dispatch(loadConversations())
			await store.dispatch(loadThread(CID))

			await store.dispatch(logout())

			expect(selectConversations(store.getState())).toEqual([])
			expect(selectLegacyMessages(store.getState())).toEqual([])
			expect(store.getState().messages.threads).toEqual({})
		})
	})

	describe('deleteTravellerMessages', () => {
		const travellerId = 'traveller-to-delete'

		describe('success scenarios', () => {
			it('removes the conversation entries and legacy messages in one authorised update', async () => {
				const result = await store.dispatch(
					deleteTravellerMessages(travellerId),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toBe(travellerId)
				expect(fetch.mock.calls[0][0]).toContain(
					`/.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(writes()).toEqual([
					{
						path: '/.json',
						method: API_DATABASE.PATCH,
						body: {
							[`userConversations/${travellerId}`]: null,
							[`legacyMessages/${travellerId}`]: null,
						},
					},
				])
			})
		})

		describe('failure scenarios', () => {
			it('rejects when the update fails', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 401 })

				const result = await store.dispatch(
					deleteTravellerMessages(travellerId),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_MESSAGES_CATCH}${travellerId}`,
				)
			})
		})
	})
})
