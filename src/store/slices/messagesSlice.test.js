import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import { MOCK_USER, MOCK_INBOX } from '@/constants/test'

import { ERROR_MESSAGES } from '@/constants/errors'
import { API_DATABASE, API_ERROR_MESSAGE } from '@/constants/api'
import { SENDER_STATUS } from '@/constants/travellers'

import messagesReducer, {
	contactTraveller,
	loadMessages,
	deleteMessage,
	deleteTravellerMessages,
	markMessagesRead,
	selectMessagesState,
	selectMessages,
	selectHasMessages,
	selectMessagesCount,
	selectUnreadMessagesCount,
	selectMessagesStatus,
	selectMessagesError,
} from './messagesSlice'

import { logout } from './authenticationSlice'
import { handleApiError } from '@/utils/errorHandler'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

vi.mock('@/utils/errorHandler', () => ({
	handleApiError: vi.fn((error, message) => {
		const errorMessage = error?.message || error
		return `${message}: ${errorMessage}`
	}),
}))

vi.mock('./authenticationSlice', async () => {
	const { createAsyncThunk } = await import('@reduxjs/toolkit')
	return {
		selectAuthenticationToken: vi.fn(() => MOCK_USER.TOKEN),
		selectUserId: vi.fn(() => MOCK_USER.USER_ID),
		logout: createAsyncThunk('authentication/logout', async () => {}),
	}
})

let store

const initialiseStore = () => {
	store = configureStore({
		reducer: {
			messages: messagesReducer,
		},
	})
}

beforeEach(() => {
	initialiseStore()
	vi.clearAllMocks()
	if (!vi.isMockFunction(global.fetch)) {
		global.fetch = vi.fn()
	}
	// mockInbox sets a lasting implementation, so clear it between tests
	fetch.mockReset()
})

setupMocks()

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const SENDER_CARD = Object.freeze({ firstName: 'Jane', lastName: 'Smith' })

// Stored shape: a traveller's message has a sender id, time and read flag; an older one only an email
const FIREBASE_INBOX = Object.freeze({
	[SAMPLE_MESSAGE_TWO.id]: {
		userEmail: SAMPLE_MESSAGE_TWO.userEmail,
		message: SAMPLE_MESSAGE_TWO.message,
	},
	[SAMPLE_MESSAGE_ONE.id]: {
		senderId: SAMPLE_MESSAGE_ONE.senderId,
		message: SAMPLE_MESSAGE_ONE.message,
		createdAt: SAMPLE_MESSAGE_ONE.createdAt,
		read: false,
	},
})

const okJson = (data) => ({ ok: true, json: async () => data })

// Answers the inbox GET and each sender lookup by URL, so the order of lookups does not matter
const mockInbox = (inbox, travellers = {}) => {
	fetch.mockImplementation(async (url) => {
		const traveller = url.match(/\/travellers\/([^.]+)\.json/)
		if (!traveller) return okJson(inbox)
		const card = travellers[traveller[1]]
		if (card instanceof Error) throw card
		if (card === 'not-ok') return { ok: false, status: 500 }
		return okJson(card ?? null)
	})
}

const travellerLookups = () =>
	fetch.mock.calls.filter(([url]) => url.includes('/travellers/'))

const seedMessages = async () => {
	mockInbox(FIREBASE_INBOX, { [SAMPLE_MESSAGE_ONE.senderId]: SENDER_CARD })
	await store.dispatch(loadMessages())
	fetch.mockReset()
}

describe('messagesSlice', () => {
	describe('initial state', () => {
		describe('success scenarios', () => {
			it('should initialise with default state', () => {
				expect(store.getState().messages).toEqual({
					messages: [],
					status: 'idle',
					error: null,
				})
			})
		})
	})

	describe('contactTraveller', () => {
		const payload = {
			travellerId: MOCK_INBOX.TRAVELLER_ID,
			message: 'Hello there',
		}

		describe('success scenarios', () => {
			it('should POST an authorised message as the signed-in sender and not store it', async () => {
				fetch.mockResolvedValueOnce(
					okJson({ name: MOCK_INBOX.NEW_MESSAGE_ID }),
				)

				const result = await store.dispatch(contactTraveller(payload))

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toEqual({
					id: MOCK_INBOX.NEW_MESSAGE_ID,
					travellerId: payload.travellerId,
					senderId: MOCK_USER.USER_ID,
					message: payload.message,
				})

				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(
					`/messages/${payload.travellerId}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('POST')
				expect(JSON.parse(options.body)).toEqual({
					senderId: MOCK_USER.USER_ID,
					message: payload.message,
					createdAt: API_DATABASE.SERVER_TIMESTAMP,
					read: false,
				})

				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.messages).toEqual([])
			})

			it('should ignore an email passed by an older caller', async () => {
				fetch.mockResolvedValueOnce(
					okJson({ name: MOCK_INBOX.NEW_MESSAGE_ID }),
				)

				await store.dispatch(
					contactTraveller({ ...payload, email: 'x@example.com' }),
				)

				expect(
					JSON.parse(fetch.mock.calls[0][1].body),
				).not.toHaveProperty('userEmail')
			})

			it('should set the status to loading while sending', () => {
				fetch.mockReturnValueOnce(new Promise(() => {}))

				store.dispatch(contactTraveller(payload))

				expect(store.getState().messages.status).toBe('loading')
				expect(store.getState().messages.error).toBeNull()
			})
		})

		describe('failure scenarios', () => {
			it.each([
				['travellerId', { travellerId: '' }],
				['travellerId', { travellerId: undefined }],
				['message', { message: '   ' }],
				['message', { message: undefined }],
			])(
				'should reject without fetching when %s is blank',
				async (_, override) => {
					const result = await store.dispatch(
						contactTraveller({ ...payload, ...override }),
					)

					expect(result.meta.requestStatus).toBe('rejected')
					expect(result.payload).toBe(
						ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD,
					)
					expect(fetch).not.toHaveBeenCalled()
					expect(store.getState().messages.status).toBe('failed')
					expect(store.getState().messages.error).toBe(
						ERROR_MESSAGES.INVALID_MESSAGE_PAYLOAD,
					)
				},
			)

			it('should reject when the response is not ok', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 500 })

				const result = await store.dispatch(contactTraveller(payload))

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.CONTACT_TRAVELLER_CATCH}${payload.travellerId}`,
				)
				expect(result.payload).toContain(ERROR_MESSAGES.REQUEST_ERROR)
			})

			it('should reject on a network error', async () => {
				fetch.mockRejectedValueOnce(new Error('Network Error'))

				const result = await store.dispatch(contactTraveller(payload))

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('loadMessages', () => {
		describe('success scenarios', () => {
			it('should GET the authorised messages, look up senders and sort newest first', async () => {
				await seedMessages()

				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.messages).toEqual([
					SAMPLE_MESSAGE_ONE,
					SAMPLE_MESSAGE_TWO,
				])
			})

			it('should send the inbox GET with the token and the sender lookup without', async () => {
				mockInbox(FIREBASE_INBOX, {
					[SAMPLE_MESSAGE_ONE.senderId]: SENDER_CARD,
				})

				await store.dispatch(loadMessages())

				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(
					`/messages/${MOCK_USER.USER_ID}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('GET')
				const lookups = travellerLookups()
				expect(lookups).toHaveLength(1)
				expect(lookups[0][0]).toContain(
					`/travellers/${SAMPLE_MESSAGE_ONE.senderId}.json`,
				)
				expect(lookups[0][0]).not.toContain('auth=')
			})

			it('should look up each sender once however many messages they sent', async () => {
				mockInbox(
					{
						a: { senderId: 's1', message: 'One', createdAt: 1 },
						b: { senderId: 's1', message: 'Two', createdAt: 2 },
						c: { senderId: 's2', message: 'Three', createdAt: 3 },
					},
					{
						s1: { firstName: 'Ana' },
						s2: { firstName: 'Bo', lastName: 'Li' },
					},
				)

				const result = await store.dispatch(loadMessages())

				expect(travellerLookups()).toHaveLength(2)
				expect(
					result.payload.map(({ id, senderName }) => [
						id,
						senderName,
					]),
				).toEqual([
					['c', 'Bo Li'],
					['b', 'Ana'],
					['a', 'Ana'],
				])
			})

			it('should mark a sender whose card is gone as a former traveller', async () => {
				mockInbox({
					a: { senderId: 'gone', message: 'Hi', createdAt: 1 },
				})

				const result = await store.dispatch(loadMessages())

				expect(result.payload[0]).toMatchObject({
					senderId: 'gone',
					senderName: null,
					senderStatus: SENDER_STATUS.FORMER,
				})
			})

			it.each([
				['is not ok', 'not-ok'],
				['fails on the network', new Error('Network Error')],
			])(
				'should mark the sender unknown, and still load, when the lookup %s',
				async (_, outcome) => {
					mockInbox(
						{ a: { senderId: 's1', message: 'Hi', createdAt: 1 } },
						{ s1: outcome },
					)

					const result = await store.dispatch(loadMessages())

					expect(result.meta.requestStatus).toBe('fulfilled')
					expect(result.payload[0]).toMatchObject({
						senderName: null,
						senderStatus: SENDER_STATUS.UNKNOWN,
					})
				},
			)

			it('should treat a message without a sender id as legacy and not look it up', async () => {
				mockInbox({
					a: { userEmail: 'old@example.com', message: 'Hi' },
				})

				const result = await store.dispatch(loadMessages())

				expect(travellerLookups()).toHaveLength(0)
				expect(result.payload[0]).toEqual({
					id: 'a',
					travellerId: MOCK_USER.USER_ID,
					senderId: null,
					senderName: null,
					senderStatus: SENDER_STATUS.LEGACY,
					userEmail: 'old@example.com',
					message: 'Hi',
					createdAt: null,
					read: true,
				})
			})

			it('should count only an explicit read false as unread', async () => {
				mockInbox(
					{
						a: {
							senderId: 's1',
							message: 'A',
							createdAt: 3,
							read: false,
						},
						b: {
							senderId: 's1',
							message: 'B',
							createdAt: 2,
							read: true,
						},
						c: { senderId: 's1', message: 'C', createdAt: 1 },
					},
					{ s1: SENDER_CARD },
				)

				const result = await store.dispatch(loadMessages())

				expect(result.payload.map(({ read }) => read)).toEqual([
					false,
					true,
					true,
				])
			})

			it('should sort dated messages newest first and undated ones last', async () => {
				mockInbox({
					old: { userEmail: 'a@example.com', message: 'Undated' },
					early: { senderId: 's1', message: 'Early', createdAt: 100 },
					late: { senderId: 's1', message: 'Late', createdAt: 200 },
				})

				const result = await store.dispatch(loadMessages())

				expect(result.payload.map(({ id }) => id)).toEqual([
					'late',
					'early',
					'old',
				])
			})

			it('should return an empty array for a null response', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => null,
				})

				const result = await store.dispatch(loadMessages())

				expect(result.payload).toEqual([])
			})

			it('should return an empty array for an empty object response', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({}),
				})

				const result = await store.dispatch(loadMessages())

				expect(result.payload).toEqual([])
			})
		})

		describe('failure scenarios', () => {
			it('should reject when the response is not ok', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 401 })

				const result = await store.dispatch(loadMessages())

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					API_ERROR_MESSAGE.LOAD_MESSAGES_CATCH,
				)
				expect(store.getState().messages.status).toBe('failed')
				expect(store.getState().messages.error).toBe(result.payload)
			})

			it('should reject on a network error', async () => {
				fetch.mockRejectedValueOnce(new Error('Network Error'))

				const result = await store.dispatch(loadMessages())

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('deleteMessage', () => {
		describe('success scenarios', () => {
			it('should send an authorised DELETE and remove the message locally', async () => {
				await seedMessages()
				fetch.mockResolvedValueOnce({ ok: true })

				const result = await store.dispatch(
					deleteMessage(SAMPLE_MESSAGE_ONE.id),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toBe(SAMPLE_MESSAGE_ONE.id)

				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(
					`/messages/${MOCK_USER.USER_ID}/${SAMPLE_MESSAGE_ONE.id}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('DELETE')
				expect(fetch).toHaveBeenCalledTimes(1)
				expect(store.getState().messages.messages).toEqual([
					SAMPLE_MESSAGE_TWO,
				])
			})

			it('should leave the load status alone while a delete runs', async () => {
				await seedMessages()
				fetch.mockReturnValueOnce(new Promise(() => {}))

				store.dispatch(deleteMessage(SAMPLE_MESSAGE_ONE.id))

				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.messages).toHaveLength(2)
			})
		})

		describe('failure scenarios', () => {
			it('should reject and keep the message when the response is not ok', async () => {
				await seedMessages()
				fetch.mockResolvedValueOnce({ ok: false, status: 403 })

				const result = await store.dispatch(
					deleteMessage(SAMPLE_MESSAGE_ONE.id),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.DELETE_MESSAGE_CATCH}${SAMPLE_MESSAGE_ONE.id}`,
				)
				expect(store.getState().messages.messages).toHaveLength(2)
				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.error).toBeNull()
			})

			it('should reject on a network error', async () => {
				fetch.mockRejectedValueOnce(new Error('Network Error'))

				const result = await store.dispatch(
					deleteMessage(SAMPLE_MESSAGE_ONE.id),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('markMessagesRead', () => {
		describe('success scenarios', () => {
			it('should PATCH each read flag with the token and keep them read', async () => {
				await seedMessages()
				fetch.mockResolvedValueOnce({ ok: true })
				const ids = [SAMPLE_MESSAGE_ONE.id, SAMPLE_MESSAGE_TWO.id]

				const result = await store.dispatch(markMessagesRead(ids))

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toEqual(ids)
				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(
					`/messages/${MOCK_USER.USER_ID}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('PATCH')
				expect(JSON.parse(options.body)).toEqual({
					[`${SAMPLE_MESSAGE_ONE.id}/read`]: true,
					[`${SAMPLE_MESSAGE_TWO.id}/read`]: true,
				})
				expect(
					store
						.getState()
						.messages.messages.every(({ read }) => read),
				).toBe(true)
			})

			it('should mark the messages read at once, before the write finishes', async () => {
				await seedMessages()
				fetch.mockReturnValueOnce(new Promise(() => {}))

				store.dispatch(markMessagesRead([SAMPLE_MESSAGE_ONE.id]))

				expect(selectUnreadMessagesCount(store.getState())).toBe(0)
				expect(store.getState().messages.status).toBe('succeeded')
			})

			it('should leave messages not in the list untouched', async () => {
				mockInbox(
					{
						a: {
							senderId: 's1',
							message: 'A',
							createdAt: 2,
							read: false,
						},
						b: {
							senderId: 's1',
							message: 'B',
							createdAt: 1,
							read: false,
						},
					},
					{ s1: SENDER_CARD },
				)
				await store.dispatch(loadMessages())
				fetch.mockReset()
				fetch.mockResolvedValueOnce({ ok: true })

				await store.dispatch(markMessagesRead(['a']))

				expect(
					store
						.getState()
						.messages.messages.map(({ id, read }) => [id, read]),
				).toEqual([
					['a', true],
					['b', false],
				])
			})
		})

		describe('failure scenarios', () => {
			it.each([
				['the response is not ok', () => ({ ok: false, status: 403 })],
				[
					'the network fails',
					() => Promise.reject(new Error('Network Error')),
				],
			])(
				'should reject and put the unread flag back when %s',
				async (_, respond) => {
					await seedMessages()
					fetch.mockImplementationOnce(async () => respond())

					const result = await store.dispatch(
						markMessagesRead([SAMPLE_MESSAGE_ONE.id]),
					)

					expect(result.meta.requestStatus).toBe('rejected')
					expect(result.payload).toContain(
						API_ERROR_MESSAGE.MARK_MESSAGES_READ_CATCH,
					)
					expect(handleApiError).toHaveBeenCalled()
					expect(selectUnreadMessagesCount(store.getState())).toBe(1)
					expect(store.getState().messages.status).toBe('succeeded')
					expect(store.getState().messages.error).toBeNull()
				},
			)
		})
	})

	describe('deleteTravellerMessages', () => {
		const travellerId = 'traveller-to-delete'

		describe('success scenarios', () => {
			it('should send an authorised DELETE for the traveller messages', async () => {
				fetch.mockResolvedValueOnce({ ok: true })

				const result = await store.dispatch(
					deleteTravellerMessages(travellerId),
				)

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toBe(travellerId)
				expect(fetch).toHaveBeenCalledWith(
					expect.stringContaining(
						`/messages/${travellerId}.json?auth=${MOCK_USER.TOKEN}`,
					),
					expect.objectContaining({ method: 'DELETE' }),
				)
			})
		})

		describe('failure scenarios', () => {
			it('should reject when the response is not ok', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 401 })

				const result = await store.dispatch(
					deleteTravellerMessages(travellerId),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(result.payload).toContain(
					`${API_ERROR_MESSAGE.DELETE_TRAVELLER_MESSAGES_CATCH}${travellerId}`,
				)
			})

			it('should reject on a network error', async () => {
				fetch.mockRejectedValueOnce(new Error('Network Error'))

				const result = await store.dispatch(
					deleteTravellerMessages(travellerId),
				)

				expect(result.meta.requestStatus).toBe('rejected')
				expect(handleApiError).toHaveBeenCalled()
			})
		})
	})

	describe('logout', () => {
		describe('success scenarios', () => {
			it('should reset the state so messages do not leak between users', async () => {
				await seedMessages()
				expect(store.getState().messages.messages).toHaveLength(2)

				await store.dispatch(logout())

				expect(store.getState().messages).toEqual({
					messages: [],
					status: 'idle',
					error: null,
				})
			})
		})
	})

	describe('selectors', () => {
		describe('success scenarios', () => {
			it('should select state, list, count and flags when empty', () => {
				const state = store.getState()

				expect(selectMessagesState(state)).toBe(state.messages)
				expect(selectMessages(state)).toEqual([])
				expect(selectHasMessages(state)).toBe(false)
				expect(selectMessagesCount(state)).toBe(0)
				expect(selectUnreadMessagesCount(state)).toBe(0)
				expect(selectMessagesStatus(state)).toBe('idle')
				expect(selectMessagesError(state)).toBeNull()
			})

			it('should select populated messages and count', async () => {
				await seedMessages()
				const state = store.getState()

				expect(selectMessages(state)).toHaveLength(2)
				expect(selectHasMessages(state)).toBe(true)
				expect(selectMessagesCount(state)).toBe(2)
				expect(selectUnreadMessagesCount(state)).toBe(1)
				expect(selectMessagesStatus(state)).toBe('succeeded')
			})

			it('should select the error after a failure', async () => {
				fetch.mockResolvedValueOnce({ ok: false, status: 500 })
				await store.dispatch(loadMessages())

				expect(selectMessagesStatus(store.getState())).toBe('failed')
				expect(selectMessagesError(store.getState())).toContain(
					API_ERROR_MESSAGE.LOAD_MESSAGES_CATCH,
				)
			})
		})
	})
})
