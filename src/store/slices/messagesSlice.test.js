import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

import { MOCK_USER, MOCK_INBOX } from '@/constants/test'

import { ERROR_MESSAGES } from '@/constants/errors'
import { API_ERROR_MESSAGE } from '@/constants/api'

import messagesReducer, {
	contactTraveller,
	loadMessages,
	deleteMessage,
	selectMessagesState,
	selectMessages,
	selectHasMessages,
	selectMessagesCount,
	selectMessagesStatus,
	selectMessagesError,
} from './messagesSlice'

import { logout } from './authenticationSlice'
import { handleApiError } from '@/utils/errorHandler'

import { setupMocks } from '@/testUtils/vitest/testingLibrarySetup'

/**
 * messagesSlice Unit Tests
 *
 * Tests Redux slice managing a traveller's private messages.
 *
 * Mocks:
 * - errorHandler: Mock error handling utility
 * - authenticationSlice: Mock token and user id selectors and a logout thunk
 * - global.fetch: Mock fetch API for simulating network requests
 *
 * Test Coverage:
 * - Initial state verification
 * - contactTraveller, loadMessages and deleteMessage success and failure scenarios
 * - Reset of state on logout
 * - Selectors for state access
 */

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
})

setupMocks()

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const toFirebaseResponse = (messages) =>
	Object.fromEntries(
		messages.map(({ id, userEmail, message }) => [
			id,
			{ userEmail, message },
		]),
	)

const seedMessages = async () => {
	fetch.mockResolvedValueOnce({
		ok: true,
		json: async () =>
			toFirebaseResponse([SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO]),
	})
	await store.dispatch(loadMessages())
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
			email: 'sender@example.com',
			message: 'Hello there',
		}

		describe('success scenarios', () => {
			it('should POST an unauthenticated message and not store it', async () => {
				fetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: MOCK_INBOX.NEW_MESSAGE_ID }),
				})

				const result = await store.dispatch(contactTraveller(payload))

				expect(result.meta.requestStatus).toBe('fulfilled')
				expect(result.payload).toEqual({
					id: MOCK_INBOX.NEW_MESSAGE_ID,
					travellerId: payload.travellerId,
					userEmail: payload.email,
					message: payload.message,
				})

				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(`/messages/${payload.travellerId}.json`)
				expect(url).not.toContain('auth=')
				expect(options.method).toBe('POST')
				expect(JSON.parse(options.body)).toEqual({
					userEmail: payload.email,
					message: payload.message,
				})

				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.messages).toEqual([])
			})
		})

		describe('failure scenarios', () => {
			it.each([
				['travellerId', { travellerId: '' }],
				['email', { email: '' }],
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
			it('should GET the authorised messages and replace the list', async () => {
				await seedMessages()

				const [url, options] = fetch.mock.calls[0]
				expect(url).toContain(
					`/messages/${MOCK_USER.USER_ID}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('GET')
				expect(store.getState().messages.status).toBe('succeeded')
				expect(store.getState().messages.messages).toEqual([
					SAMPLE_MESSAGE_ONE,
					SAMPLE_MESSAGE_TWO,
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

				const [url, options] = fetch.mock.calls[1]
				expect(url).toContain(
					`/messages/${MOCK_USER.USER_ID}/${SAMPLE_MESSAGE_ONE.id}.json?auth=${MOCK_USER.TOKEN}`,
				)
				expect(options.method).toBe('DELETE')
				expect(fetch).toHaveBeenCalledTimes(2)
				expect(store.getState().messages.messages).toEqual([
					SAMPLE_MESSAGE_TWO,
				])
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
				expect(selectMessagesStatus(state)).toBe('idle')
				expect(selectMessagesError(state)).toBeNull()
			})

			it('should select populated messages and count', async () => {
				await seedMessages()
				const state = store.getState()

				expect(selectMessages(state)).toHaveLength(2)
				expect(selectHasMessages(state)).toBe(true)
				expect(selectMessagesCount(state)).toBe(2)
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
