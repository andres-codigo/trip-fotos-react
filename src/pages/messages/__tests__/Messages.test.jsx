import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import {
	MESSAGE_ITEM,
	MESSAGE_SKELETON,
	MESSAGES_PAGE,
	MOCK_INBOX,
	TEST_IDS,
	TOAST,
} from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { ACCESSIBILITY, GLOBAL, PATHS } from '@/constants/ui'

import Messages from '@/pages/messages/Messages'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const SENDER_CARD = { firstName: 'Jane', lastName: 'Smith' }

// The database records behind MOCK_INBOX: ONE is an unread traveller message, TWO an older email message
const RECORD_ONE = {
	senderId: SAMPLE_MESSAGE_ONE.senderId,
	message: SAMPLE_MESSAGE_ONE.message,
	createdAt: SAMPLE_MESSAGE_ONE.createdAt,
	read: false,
}
const RECORD_TWO = {
	userEmail: SAMPLE_MESSAGE_TWO.userEmail,
	message: SAMPLE_MESSAGE_TWO.message,
}
const INBOX = {
	[SAMPLE_MESSAGE_ONE.id]: RECORD_ONE,
	[SAMPLE_MESSAGE_TWO.id]: RECORD_TWO,
}

const okResponse = (body) => ({ ok: true, json: async () => body })
const failResponse = () => ({ ok: false, json: async () => ({}) })

const deferred = () => {
	let resolve
	const promise = new Promise((done) => (resolve = done))
	return { promise, resolve }
}

// Answers each request by method and path, as the Realtime Database REST API would
const stubDatabase = ({
	inbox = INBOX,
	loadResponse,
	deleteResponses = [],
} = {}) => {
	const deletes = [...deleteResponses]
	const fetchMock = vi.fn(async (url, { method } = {}) => {
		const { pathname } = new URL(url, 'http://localhost')

		if (method === 'DELETE') {
			return deletes.length ? deletes.shift() : okResponse(null)
		}
		if (method === 'PATCH') return okResponse(null)
		if (pathname.endsWith('/messages/me.json')) {
			return loadResponse ?? okResponse(inbox)
		}
		if (
			pathname.endsWith(`/travellers/${SAMPLE_MESSAGE_ONE.senderId}.json`)
		) {
			return okResponse(SENDER_CARD)
		}
		return okResponse(null)
	})
	vi.stubGlobal('fetch', fetchMock)
	return fetchMock
}

const requestsBy = (fetchMock, method) =>
	fetchMock.mock.calls.filter(([, options]) => options?.method === method)

const deleteUrls = (fetchMock) =>
	requestsBy(fetchMock, 'DELETE').map(([url]) => url)

const deleteUrl = (id) => `/messages/me/${id}.json`

const renderPage = (initialEntry = PATHS.MESSAGES) => {
	const store = configureStore({
		reducer: {
			authentication: authenticationReducer,
			messages: messagesReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId: 'me',
				token: 'token',
			},
		},
	})

	const utils = render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[initialEntry]}>
				<Messages />
			</MemoryRouter>
		</Provider>,
	)

	return { ...utils, store }
}

const cardFor = (message) =>
	screen
		.getAllByTestId(MESSAGE_ITEM.ROOT)
		.find((item) => item.textContent.includes(message.message))

const deleteButton = (message) =>
	within(cardFor(message)).getByTestId(MESSAGE_ITEM.DELETE)

const replyButton = (message) =>
	within(cardFor(message)).getByTestId(MESSAGE_ITEM.REPLY)

const renderLoaded = async (options) => {
	const fetchMock = stubDatabase(options)
	const utils = renderPage()
	await screen.findByTestId(MESSAGES_PAGE.LIST)
	return { ...utils, fetchMock }
}

describe('Messages', () => {
	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	describe('Rendering tests', () => {
		it('<main> is the skip link target with the expected classes and data attributes', async () => {
			stubDatabase({ inbox: null })
			renderPage()
			await screen.findByTestId(MESSAGES_PAGE.EMPTY)

			const main = screen.getByRole('main')

			expect(main).toHaveAttribute('id', ACCESSIBILITY.MAIN_CONTENT_ID)
			expect(main).toHaveAttribute('tabindex', '-1')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.MESSAGES.CONTAINER,
			)
			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
		})

		it('sets the document title and renders a focusable heading', async () => {
			stubDatabase({ inbox: null })
			renderPage()
			await screen.findByTestId(MESSAGES_PAGE.EMPTY)

			expect(document.title).toBe(`Messages · ${GLOBAL.SITE_NAME}`)
			const heading = screen.getByRole('heading', { level: 1 })
			expect(heading).toHaveTextContent(MESSAGES_CONFIG.TITLE)
			expect(heading).toHaveAttribute('tabindex', '-1')
		})
	})

	describe('Loading messages', () => {
		it('shows skeleton cards and a loading status while loading', async () => {
			const load = deferred()
			stubDatabase({ loadResponse: load.promise })
			renderPage()

			expect(screen.getByTestId(MESSAGES_PAGE.LOADING)).toHaveTextContent(
				GLOBAL.SPINNER_LABEL.MESSAGES,
			)
			expect(screen.getByRole('status')).toHaveTextContent(
				GLOBAL.SPINNER_LABEL.MESSAGES,
			)
			const skeletons = screen.getAllByTestId(MESSAGE_SKELETON.ROOT)
			expect(skeletons).toHaveLength(MESSAGES_CONFIG.SKELETON_COUNT)
			expect(skeletons[0].parentElement).toHaveAttribute(
				'aria-busy',
				'true',
			)
			expect(
				screen.queryByTestId(MESSAGES_PAGE.EMPTY),
			).not.toBeInTheDocument()

			load.resolve(okResponse(null))

			await screen.findByTestId(MESSAGES_PAGE.EMPTY)
			expect(
				screen.queryByTestId(MESSAGES_PAGE.LOADING),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(MESSAGE_SKELETON.ROOT),
			).not.toBeInTheDocument()
		})

		it('lists the messages newest first with an unread summary', async () => {
			const { fetchMock } = await renderLoaded()

			const items = screen.getAllByTestId(MESSAGE_ITEM.ROOT)
			expect(items).toHaveLength(2)
			expect(items[0]).toHaveTextContent(SAMPLE_MESSAGE_ONE.senderName)
			expect(items[1]).toHaveTextContent(SAMPLE_MESSAGE_TWO.userEmail)
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(1, 2),
			)
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveAttribute(
				'role',
				'status',
			)
			expect(fetchMock.mock.calls[0][0]).toContain(
				'/messages/me.json?auth=token',
			)
		})

		it('marks only the unread messages read, and keeps their marker for the visit', async () => {
			const { fetchMock, store } = await renderLoaded()

			await waitFor(() =>
				expect(requestsBy(fetchMock, 'PATCH')).toHaveLength(1),
			)
			const [[url, options]] = requestsBy(fetchMock, 'PATCH')
			expect(url).toContain('/messages/me.json')
			expect(JSON.parse(options.body)).toEqual({
				[`${SAMPLE_MESSAGE_ONE.id}/read`]: true,
			})
			await waitFor(() =>
				expect(
					store
						.getState()
						.messages.messages.every((message) => message.read),
				).toBe(true),
			)

			expect(
				within(cardFor(SAMPLE_MESSAGE_ONE)).getByTestId(
					MESSAGE_ITEM.NEW_TAG,
				),
			).toBeInTheDocument()
			expect(
				within(cardFor(SAMPLE_MESSAGE_TWO)).queryByTestId(
					MESSAGE_ITEM.NEW_TAG,
				),
			).not.toBeInTheDocument()
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(1, 2),
			)
		})

		it('marks nothing read when every message is already read', async () => {
			const { fetchMock } = await renderLoaded({
				inbox: { [SAMPLE_MESSAGE_TWO.id]: RECORD_TWO },
			})

			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(0, 1),
			)
			expect(
				screen.queryByTestId(MESSAGE_ITEM.NEW_TAG),
			).not.toBeInTheDocument()
			expect(requestsBy(fetchMock, 'PATCH')).toHaveLength(0)
		})

		it('shows the empty state with a Browse travellers link when there are no messages', async () => {
			stubDatabase({ inbox: null })
			renderPage()

			const empty = await screen.findByTestId(MESSAGES_PAGE.EMPTY)
			expect(empty).toHaveTextContent(MESSAGES_CONFIG.EMPTY_TITLE)
			expect(empty).toHaveTextContent(MESSAGES_CONFIG.EMPTY_TEXT)
			expect(
				screen.getByTestId(MESSAGES_PAGE.BROWSE_TRAVELLERS),
			).toHaveAttribute('href', PATHS.TRAVELLERS)
			expect(
				screen.queryByTestId(MESSAGES_PAGE.SUMMARY),
			).not.toBeInTheDocument()
		})

		it('shows an error dialog when loading fails', async () => {
			stubDatabase({ loadResponse: failResponse() })
			renderPage()

			const dialog = await screen.findByTestId(MESSAGES_PAGE.ERROR_DIALOG)
			expect(dialog).toHaveTextContent(ERROR_MESSAGES.REQUEST_ERROR)
			expect(screen.getByTestId(MESSAGES_PAGE.EMPTY)).toBeInTheDocument()
		})
	})

	describe('Alert from another page', () => {
		it('shows the alert message passed in the location state', async () => {
			stubDatabase({ inbox: null })
			renderPage({
				pathname: PATHS.MESSAGES,
				state: { alertMessage: 'Your reply has been sent!' },
			})

			expect(
				screen.getByText('Your reply has been sent!'),
			).toBeInTheDocument()
			await screen.findByTestId(MESSAGES_PAGE.EMPTY)
		})

		it('shows no alert without one', async () => {
			stubDatabase({ inbox: null })
			renderPage()

			await screen.findByTestId(MESSAGES_PAGE.EMPTY)
			expect(
				screen.queryByText('Your reply has been sent!'),
			).not.toBeInTheDocument()
		})
	})

	describe('Deleting a message', () => {
		it('hides the card and shows the Undo toast, without sending a delete yet', async () => {
			const { fetchMock } = await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))

			expect(
				screen.queryByText(SAMPLE_MESSAGE_ONE.message),
			).not.toBeInTheDocument()
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(1)
			expect(
				screen.getByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).toHaveTextContent(MESSAGES_CONFIG.DELETED)
			expect(screen.getByTestId(TOAST.ACTION)).toHaveTextContent(
				MESSAGES_CONFIG.UNDO,
			)
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(0, 1),
			)
			expect(deleteUrls(fetchMock)).toHaveLength(0)
		})

		it('Undo restores the card, focuses its Reply and never sends a delete', async () => {
			const { fetchMock } = await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.ACTION))

			expect(
				screen.queryByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).not.toBeInTheDocument()
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(2)
			expect(replyButton(SAMPLE_MESSAGE_ONE)).toHaveFocus()
			expect(screen.getByTestId(MESSAGES_PAGE.SUMMARY)).toHaveTextContent(
				MESSAGES_CONFIG.SUMMARY(1, 2),
			)
			await act(async () => {})
			expect(deleteUrls(fetchMock)).toHaveLength(0)
		})

		it('sends the delete once the toast runs out, and the card stays gone', async () => {
			const { fetchMock, store } = await renderLoaded()
			vi.useFakeTimers()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			act(() => {
				vi.advanceTimersByTime(MESSAGES_CONFIG.UNDO_DURATION_MS - 1)
			})
			expect(deleteUrls(fetchMock)).toHaveLength(0)

			act(() => {
				vi.advanceTimersByTime(1)
			})
			vi.useRealTimers()

			expect(
				screen.queryByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).not.toBeInTheDocument()
			await waitFor(() =>
				expect(store.getState().messages.messages).toHaveLength(1),
			)
			const [[url, options]] = requestsBy(fetchMock, 'DELETE')
			expect(url).toContain(
				`${deleteUrl(SAMPLE_MESSAGE_ONE.id)}?auth=token`,
			)
			expect(options.method).toBe('DELETE')
			expect(
				screen.queryByText(SAMPLE_MESSAGE_ONE.message),
			).not.toBeInTheDocument()
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(1)
		})

		it('Dismiss sends the delete at once', async () => {
			const { fetchMock, store } = await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.DISMISS))

			expect(
				screen.queryByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).not.toBeInTheDocument()
			await waitFor(() =>
				expect(store.getState().messages.messages).toHaveLength(1),
			)
			expect(deleteUrls(fetchMock)).toEqual([
				expect.stringContaining(deleteUrl(SAMPLE_MESSAGE_ONE.id)),
			])
			expect(
				screen.queryByText(SAMPLE_MESSAGE_ONE.message),
			).not.toBeInTheDocument()
		})

		it('a second delete sends the first at once and offers Undo for the second', async () => {
			const { fetchMock } = await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(deleteButton(SAMPLE_MESSAGE_TWO))

			expect(deleteUrls(fetchMock)).toEqual([
				expect.stringContaining(deleteUrl(SAMPLE_MESSAGE_ONE.id)),
			])
			expect(
				screen.getByTestId(MESSAGES_PAGE.UNDO_TOAST),
			).toBeInTheDocument()

			fireEvent.click(screen.getByTestId(TOAST.ACTION))

			await waitFor(() =>
				expect(
					screen.queryByText(SAMPLE_MESSAGE_ONE.message),
				).not.toBeInTheDocument(),
			)
			expect(
				screen.getByText(SAMPLE_MESSAGE_TWO.message),
			).toBeInTheDocument()
			expect(deleteUrls(fetchMock)).toHaveLength(1)
		})

		it('leaving the page sends the waiting delete', async () => {
			const { fetchMock, unmount } = await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			unmount()

			await waitFor(() =>
				expect(deleteUrls(fetchMock)).toEqual([
					expect.stringContaining(deleteUrl(SAMPLE_MESSAGE_ONE.id)),
				]),
			)
		})

		it('leaving the page with nothing waiting sends no delete', async () => {
			const { fetchMock, unmount } = await renderLoaded()

			unmount()
			await act(async () => {})

			expect(deleteUrls(fetchMock)).toHaveLength(0)
		})

		it('a failed delete brings the card back with an alert, and Try again re-sends it', async () => {
			const retry = deferred()
			const { fetchMock, store } = await renderLoaded({
				deleteResponses: [failResponse(), retry.promise],
			})

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.DISMISS))

			const alert = await screen.findByTestId(MESSAGE_ITEM.DELETE_ERROR)
			expect(alert).toHaveAttribute('role', 'alert')
			expect(alert).toHaveTextContent(
				ERROR_MESSAGES.FAILED_TO_DELETE_MESSAGE,
			)
			expect(cardFor(SAMPLE_MESSAGE_ONE)).toContainElement(alert)

			const tryAgain = screen.getByTestId(MESSAGE_ITEM.TRY_AGAIN)
			fireEvent.click(tryAgain)

			expect(tryAgain).toBeDisabled()
			expect(deleteUrls(fetchMock)).toEqual([
				expect.stringContaining(deleteUrl(SAMPLE_MESSAGE_ONE.id)),
				expect.stringContaining(deleteUrl(SAMPLE_MESSAGE_ONE.id)),
			])

			retry.resolve(okResponse(null))

			await waitFor(() =>
				expect(
					screen.queryByText(SAMPLE_MESSAGE_ONE.message),
				).not.toBeInTheDocument(),
			)
			expect(store.getState().messages.messages).toHaveLength(1)
			expect(
				screen.queryByTestId(MESSAGE_ITEM.DELETE_ERROR),
			).not.toBeInTheDocument()
		})

		it('a failed retry keeps the alert and enables Try again again', async () => {
			await renderLoaded({
				deleteResponses: [failResponse(), failResponse()],
			})

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.DISMISS))
			fireEvent.click(await screen.findByTestId(MESSAGE_ITEM.TRY_AGAIN))

			await waitFor(() =>
				expect(
					screen.getByTestId(MESSAGE_ITEM.TRY_AGAIN),
				).toBeEnabled(),
			)
			expect(
				screen.getByTestId(MESSAGE_ITEM.DELETE_ERROR),
			).toBeInTheDocument()
			expect(cardFor(SAMPLE_MESSAGE_ONE)).toBeInTheDocument()
		})

		it('deleting a failed message again clears its alert', async () => {
			await renderLoaded({ deleteResponses: [failResponse()] })

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.DISMISS))
			await screen.findByTestId(MESSAGE_ITEM.DELETE_ERROR)

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))
			fireEvent.click(screen.getByTestId(TOAST.ACTION))

			expect(
				screen.queryByTestId(MESSAGE_ITEM.DELETE_ERROR),
			).not.toBeInTheDocument()
		})
	})

	describe('Focus after a delete', () => {
		it('moves to the next card’s Reply', async () => {
			await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))

			expect(replyButton(SAMPLE_MESSAGE_TWO)).toHaveFocus()
		})

		it('moves to the previous card when the last one is deleted', async () => {
			await renderLoaded()

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_TWO))

			expect(replyButton(SAMPLE_MESSAGE_ONE)).toHaveFocus()
		})

		it('moves to the next card’s Delete when it has no Reply', async () => {
			await renderLoaded({
				inbox: {
					...INBOX,
					[SAMPLE_MESSAGE_TWO.id]: { ...RECORD_TWO, userEmail: null },
				},
			})

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))

			expect(
				within(screen.getByTestId(MESSAGE_ITEM.ROOT)).getByTestId(
					MESSAGE_ITEM.DELETE,
				),
			).toHaveFocus()
		})

		it('moves to the heading when no card is left, with the empty state', async () => {
			await renderLoaded({
				inbox: { [SAMPLE_MESSAGE_ONE.id]: RECORD_ONE },
			})

			fireEvent.click(deleteButton(SAMPLE_MESSAGE_ONE))

			expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
			expect(screen.getByTestId(MESSAGES_PAGE.EMPTY)).toBeInTheDocument()
		})
	})
})
