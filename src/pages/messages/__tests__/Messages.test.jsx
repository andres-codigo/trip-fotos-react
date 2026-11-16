import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

import {
	CONVERSATION_ROW,
	CONVERSATION_SKELETON,
	MESSAGE_BUBBLE,
	MESSAGE_THREAD,
	MESSAGES_PAGE,
	REPLY_BOX,
	THREAD_HEADER,
	THREAD_NOTE,
	TOAST,
	VERIFY_EMAIL_NOTE,
} from '@/constants/test'
import { API_DATABASE } from '@/constants/api'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { GLOBAL, PATHS } from '@/constants/ui'

import Messages from '@/pages/messages/Messages'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import { VERIFY_EMAIL_PROMPT_CONFIG } from '@/constants/auth'

const viewport = vi.hoisted(() => ({ width: 390 }))

vi.mock('@/utils/useViewport', () => ({
	default: () => viewport,
}))

const ME = 'me'
const OTHER = 'other'
const FORMER = 'former'
const CID = 'me_other'
const FORMER_CID = 'former_me'
const NOW = 1794290000000

const LIST = {
	[CID]: {
		otherId: OTHER,
		lastId: 'm2',
		lastMessage: 'Fancy meeting for sunset?',
		lastSenderId: OTHER,
		lastAt: NOW - 1000,
		readAt: NOW - 50000,
	},
	[FORMER_CID]: {
		otherId: FORMER,
		lastId: 'f1',
		lastMessage: 'Thanks for the tips.',
		lastSenderId: FORMER,
		lastAt: NOW - 90000000,
		readAt: NOW - 90000000,
	},
}
const LEGACY = {
	old1: { userEmail: 'old.friend@example.com', message: 'Great photos!' },
}
const THREAD = {
	m0: {
		senderId: ME,
		message: 'Walk up, tram down.',
		createdAt: NOW - 60000,
	},
	m1: {
		senderId: OTHER,
		message: 'We land Thursday.',
		createdAt: NOW - 2000,
	},
	m2: {
		senderId: OTHER,
		message: 'Fancy meeting for sunset?',
		createdAt: NOW - 1000,
	},
}

const okResponse = (body) => ({ ok: true, json: async () => body })
const failResponse = () => ({ ok: false, status: 500, json: async () => ({}) })

// Strips the base rather than parsing the URL: CI sets no VITE_BACKEND_BASE_URL, so the URL starts with "undefined"
const pathOf = (url) =>
	url.slice(String(API_DATABASE.BASE_URL).length).split('?')[0]

const stubDatabase = ({ list = LIST, legacy = LEGACY, listFails } = {}) => {
	const fetchMock = vi.fn(async (url, { method } = {}) => {
		const path = pathOf(url).replace(/\.json$/, '')
		if (method && method !== 'GET') return okResponse(null)
		if (path.endsWith(`/userConversations/${ME}`))
			return listFails ? failResponse() : okResponse(list)
		if (path.endsWith(`/legacyMessages/${ME}`)) return okResponse(legacy)
		if (path.endsWith(`/conversations/${CID}/messages`))
			return okResponse(THREAD)
		if (path.endsWith(`/travellers/${OTHER}`))
			return okResponse({
				firstName: 'Tomás',
				lastName: 'Silva',
				cities: [{ city: 'Lisbon', country: 'Portugal' }],
			})
		return okResponse(null)
	})
	vi.stubGlobal('fetch', fetchMock)
	return fetchMock
}

const writes = (fetchMock) =>
	fetchMock.mock.calls
		.filter(([, options]) => options?.method && options.method !== 'GET')
		.map(([url, options]) => ({
			path: pathOf(url),
			body: options.body && JSON.parse(options.body),
		}))

const renderPage = (path = PATHS.MESSAGES, { emailVerified = true } = {}) => {
	const store = configureTestStore({
		reducer: {
			authentication: authenticationReducer,
			messages: messagesReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId: ME,
				token: 'token',
				emailVerified,
			},
		},
	})
	const router = createMemoryRouter(
		[{ path: `${PATHS.MESSAGES}/:conversationId?`, element: <Messages /> }],
		{ initialEntries: [path] },
	)
	render(
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>,
	)
	return { router, store }
}

const pathname = (router) => router.state.location.pathname

beforeEach(() => {
	viewport.width = 390
	vi.spyOn(Date, 'now').mockReturnValue(NOW)
	Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('Messages page', () => {
	describe('the list', () => {
		it('shows skeleton rows while it loads, then one row per conversation', async () => {
			stubDatabase()
			renderPage()

			expect(screen.getByTestId(MESSAGES_PAGE.LOADING)).toHaveTextContent(
				GLOBAL.SPINNER_LABEL.MESSAGES,
			)
			expect(
				screen.getAllByTestId(CONVERSATION_SKELETON.ROW),
			).toHaveLength(MESSAGES_CONFIG.LIST_SKELETON_COUNT)

			expect(
				await screen.findByTestId(MESSAGES_PAGE.SUMMARY),
			).toHaveTextContent(MESSAGES_CONFIG.SUMMARY(1, 3))
			const names = screen
				.getAllByTestId(CONVERSATION_ROW.NAME)
				.map((name) => name.textContent)
			expect(names).toEqual([
				`Tomás Silva${MESSAGES_CONFIG.NEW_ROW_HIDDEN}`,
				MESSAGES_CONFIG.FORMER_TRAVELLER,
				'old.friend@example.com',
			])
			expect(screen.getAllByTestId(CONVERSATION_ROW.DOT)).toHaveLength(1)
			expect(
				screen.queryByTestId(MESSAGES_PAGE.THREAD_CARD),
			).not.toBeInTheDocument()
		})

		it('shows the empty state with Browse travellers', async () => {
			stubDatabase({ list: null, legacy: null })
			renderPage()

			expect(
				await screen.findByTestId(MESSAGES_PAGE.EMPTY),
			).toHaveTextContent(MESSAGES_CONFIG.EMPTY_TITLE)
			expect(
				screen.getByTestId(MESSAGES_PAGE.BROWSE_TRAVELLERS),
			).toHaveAttribute('href', PATHS.TRAVELLERS)
		})

		it('shows an error dialog when the list cannot be loaded', async () => {
			stubDatabase({ listFails: true })
			renderPage()

			expect(
				await screen.findByTestId(MESSAGES_PAGE.ERROR_DIALOG),
			).toBeInTheDocument()
		})

		it('opens the first conversation in place from 1024px', async () => {
			viewport.width = GLOBAL.BREAKPOINT.TABLET
			stubDatabase()
			const { router } = renderPage()

			await waitFor(() =>
				expect(pathname(router)).toBe(`${PATHS.MESSAGES}/${CID}`),
			)
			expect(router.state.historyAction).toBe('REPLACE')
			expect(
				await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT),
			).toHaveLength(3)
			expect(
				screen.getByTestId(MESSAGES_PAGE.LIST_CARD),
			).toBeInTheDocument()
		})
	})

	describe('a thread', () => {
		it('shows both sides, marks it read and keeps "New" for the visit', async () => {
			const fetchMock = stubDatabase()
			renderPage(`${PATHS.MESSAGES}/${CID}`)

			expect(
				await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT),
			).toHaveLength(3)
			expect(
				screen.getByTestId(MESSAGE_THREAD.NEW_DIVIDER),
			).toBeInTheDocument()
			expect(screen.getByTestId(THREAD_HEADER.NAME)).toHaveTextContent(
				'Tomás Silva',
			)
			expect(
				screen.getByTestId(THREAD_HEADER.SUBTITLE),
			).toHaveTextContent(MESSAGES_CONFIG.TRAVELLER_SUBTITLE('Lisbon'))
			await waitFor(() =>
				expect(writes(fetchMock)).toContainEqual({
					path: `/userConversations/${ME}/${CID}.json`,
					body: { readAt: { '.sv': 'timestamp' } },
				}),
			)
			expect(
				screen.getByTestId(MESSAGE_THREAD.NEW_DIVIDER),
			).toBeInTheDocument()
		})

		it('sends a reply with both summaries in one update and shows it at once', async () => {
			const fetchMock = stubDatabase()
			renderPage(`${PATHS.MESSAGES}/${CID}`)
			await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT)

			fireEvent.change(screen.getByTestId(REPLY_BOX.INPUT), {
				target: { value: 'Yes! 7 it is.' },
			})
			fireEvent.click(screen.getByTestId(REPLY_BOX.SEND))

			expect(await screen.findByText('Yes! 7 it is.')).toBeInTheDocument()
			await waitFor(() => {
				const send = writes(fetchMock).find(
					({ path }) => path === '/.json',
				)
				expect(Object.keys(send.body)).toEqual(
					expect.arrayContaining([
						`userConversations/${ME}/${CID}/lastId`,
						`userConversations/${OTHER}/${CID}/lastId`,
					]),
				)
			})
		})

		it('lists a thread opened from a card with nothing said yet, saying hello', async () => {
			stubDatabase({ list: null, legacy: null })
			renderPage(`${PATHS.MESSAGES}/${CID}`)

			fetch.mockImplementation(async (url) => {
				const path = pathOf(url)
				if (path.endsWith(`/travellers/${OTHER}.json`))
					return okResponse({ firstName: 'Tomás', lastName: 'Silva' })
				return okResponse(null)
			})

			expect(
				await screen.findByTestId(MESSAGE_THREAD.HELLO),
			).toHaveTextContent(MESSAGES_CONFIG.SAY_HELLO('Tomás Silva'))
			// The thread is listed while it is open, and counted with the rest
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(0, 1),
			)
			expect(screen.getByTestId(REPLY_BOX.INPUT)).toBeInTheDocument()
		})

		it('shows the verify note in place of the reply box for an unverified account', async () => {
			stubDatabase({ list: null, legacy: null })
			renderPage(`${PATHS.MESSAGES}/${CID}`, { emailVerified: false })

			fetch.mockImplementation(async (url) => {
				const path = pathOf(url)
				if (path.endsWith(`/travellers/${OTHER}.json`))
					return okResponse({ firstName: 'Tomás', lastName: 'Silva' })
				return okResponse(null)
			})

			expect(
				await screen.findByTestId(VERIFY_EMAIL_NOTE.ROOT),
			).toHaveTextContent(VERIFY_EMAIL_PROMPT_CONFIG.REPLY_NOTE_TITLE)
			expect(
				screen.queryByTestId(REPLY_BOX.INPUT),
			).not.toBeInTheDocument()
		})

		it('shows a former traveller’s thread read-only', async () => {
			stubDatabase()
			renderPage(`${PATHS.MESSAGES}/${FORMER_CID}`)

			expect(
				await screen.findByTestId(THREAD_NOTE.ROOT),
			).toHaveTextContent(MESSAGES_CONFIG.FORMER_NOTE_TITLE)
			expect(screen.queryByTestId(REPLY_BOX.ROOT)).not.toBeInTheDocument()
		})

		it('shows an email-only message with Reply by email and no reply box', async () => {
			stubDatabase()
			renderPage(
				`${PATHS.MESSAGES}/${MESSAGES_CONFIG.LEGACY_ID_PREFIX}old1`,
			)

			expect(
				await screen.findByTestId(THREAD_NOTE.REPLY_BY_EMAIL),
			).toHaveAttribute(
				'href',
				expect.stringMatching(/^mailto:old\.friend@example\.com\?/),
			)
			expect(screen.getByTestId(MESSAGE_BUBBLE.TEXT)).toHaveTextContent(
				'Great photos!',
			)
			expect(screen.queryByTestId(REPLY_BOX.ROOT)).not.toBeInTheDocument()
		})

		it('shows the load error with Try again, not "Say hello", when the thread cannot be loaded', async () => {
			const fetchMock = stubDatabase()
			const answer = fetchMock.getMockImplementation()
			fetchMock.mockImplementation(async (url, options) =>
				url.includes(`/conversations/${CID}/messages.json`)
					? failResponse()
					: answer(url, options),
			)
			renderPage(`${PATHS.MESSAGES}/${CID}`)

			expect(
				await screen.findByTestId(MESSAGES_PAGE.THREAD_ERROR),
			).toHaveTextContent(MESSAGES_CONFIG.THREAD_LOAD_ERROR)
			expect(
				screen.queryByTestId(MESSAGE_THREAD.HELLO),
			).not.toBeInTheDocument()
			expect(screen.getByTestId(REPLY_BOX.INPUT)).toBeInTheDocument()

			fetchMock.mockImplementation(answer)
			fireEvent.click(screen.getByTestId(MESSAGES_PAGE.THREAD_TRY_AGAIN))
			expect(
				await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT),
			).toHaveLength(3)
		})

		it('sends a visitor away from a conversation they are not in', async () => {
			stubDatabase()
			const { router } = renderPage(`${PATHS.MESSAGES}/other_someone`)

			await waitFor(() => expect(pathname(router)).toBe(PATHS.MESSAGES))
		})
	})

	describe('deleting', () => {
		const deleteOpenThread = async () => {
			fireEvent.click(screen.getByTestId(THREAD_HEADER.MENU_BUTTON))
			fireEvent.click(screen.getByTestId(THREAD_HEADER.DELETE))
		}

		it('hides the conversation behind the Undo toast, and Undo brings it back', async () => {
			const fetchMock = stubDatabase()
			const { router } = renderPage(`${PATHS.MESSAGES}/${CID}`)
			await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT)

			await deleteOpenThread()

			await waitFor(() => expect(pathname(router)).toBe(PATHS.MESSAGES))
			expect(
				screen.getByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).toHaveTextContent(MESSAGES_CONFIG.DELETED)
			expect(screen.getAllByTestId(CONVERSATION_ROW.ROOT)).toHaveLength(2)

			fireEvent.click(screen.getByTestId(TOAST.ACTION))
			expect(screen.getAllByTestId(CONVERSATION_ROW.ROOT)).toHaveLength(3)
			expect(
				writes(fetchMock).filter(({ body }) => body?.clearedAt),
			).toHaveLength(0)
		})

		it('clears it for good once the toast closes', async () => {
			const fetchMock = stubDatabase()
			renderPage(`${PATHS.MESSAGES}/${CID}`)
			await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT)

			await deleteOpenThread()
			fireEvent.click(await screen.findByTestId(TOAST.DISMISS))

			await waitFor(() =>
				expect(writes(fetchMock)).toContainEqual({
					path: `/userConversations/${ME}/${CID}.json`,
					body: {
						readAt: { '.sv': 'timestamp' },
						clearedAt: { '.sv': 'timestamp' },
					},
				}),
			)
		})

		it('opens the next conversation from 1024px', async () => {
			viewport.width = GLOBAL.BREAKPOINT.TABLET
			stubDatabase()
			const { router } = renderPage(`${PATHS.MESSAGES}/${CID}`)
			await screen.findAllByTestId(MESSAGE_BUBBLE.ROOT)

			await deleteOpenThread()

			await waitFor(() =>
				expect(pathname(router)).toBe(
					`${PATHS.MESSAGES}/${FORMER_CID}`,
				),
			)
		})
	})
})
