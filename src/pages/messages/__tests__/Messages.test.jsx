import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import {
	MESSAGE_ITEM,
	MESSAGES_PAGE,
	MOCK_INBOX,
	TEST_IDS,
} from '@/constants/test'
import { ACCESSIBILITY, GLOBAL } from '@/constants/ui'

import Messages from '@/pages/messages/Messages'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

import messagesStyles from '@/pages/messages/Messages.module.scss'

const { SAMPLE_MESSAGE_ONE, SAMPLE_MESSAGE_TWO } = MOCK_INBOX

const stubFetch = (response) => {
	const fetchMock = vi.fn().mockResolvedValue(response)
	vi.stubGlobal('fetch', fetchMock)
	return fetchMock
}

const okResponse = (body) => ({ ok: true, json: async () => body })

const renderPage = () => {
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

	return render(
		<Provider store={store}>
			<Messages />
		</Provider>,
	)
}

describe('Messages', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	describe('Rendering tests', () => {
		it('<main> is the skip link target with the expected classes and data attributes', async () => {
			stubFetch(okResponse(null))
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
			expect(main.className).toMatch(
				new RegExp(messagesStyles.messagesContainer),
			)
		})

		it('sets the document title and renders the heading', async () => {
			stubFetch(okResponse(null))
			renderPage()
			await screen.findByTestId(MESSAGES_PAGE.EMPTY)

			expect(document.title).toBe(`Messages · ${GLOBAL.SITE_NAME}`)
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
				'Messages',
			)
		})
	})

	describe('Loading messages', () => {
		it('shows a spinner, then the received messages', async () => {
			const fetchMock = stubFetch(
				okResponse({
					[SAMPLE_MESSAGE_ONE.id]: {
						userEmail: SAMPLE_MESSAGE_ONE.userEmail,
						message: SAMPLE_MESSAGE_ONE.message,
					},
					[SAMPLE_MESSAGE_TWO.id]: {
						userEmail: SAMPLE_MESSAGE_TWO.userEmail,
						message: SAMPLE_MESSAGE_TWO.message,
					},
				}),
			)
			renderPage()

			expect(
				screen.getByTestId(MESSAGES_PAGE.SPINNER),
			).toBeInTheDocument()
			expect(
				await screen.findByText(SAMPLE_MESSAGE_ONE.message),
			).toBeInTheDocument()
			expect(
				screen.getByText(SAMPLE_MESSAGE_TWO.userEmail),
			).toBeInTheDocument()
			expect(screen.queryByTestId(MESSAGES_PAGE.SPINNER)).toBeNull()
			expect(fetchMock.mock.calls[0][0]).toContain(
				'/messages/me.json?auth=token',
			)
		})

		it('shows the empty state when there are no messages', async () => {
			stubFetch(okResponse(null))
			renderPage()

			expect(
				await screen.findByTestId(MESSAGES_PAGE.EMPTY),
			).toHaveTextContent("You don't have any messages yet!")
		})

		it('shows an error dialog when loading fails', async () => {
			stubFetch({ ok: false, json: async () => ({}) })
			renderPage()

			const dialog = await screen.findByTestId(MESSAGES_PAGE.ERROR_DIALOG)
			expect(dialog).toHaveTextContent(ERROR_MESSAGES.REQUEST_ERROR)
			expect(screen.getByTestId(MESSAGES_PAGE.EMPTY)).toBeInTheDocument()
		})
	})

	describe('Deleting a message', () => {
		const inbox = {
			[SAMPLE_MESSAGE_ONE.id]: {
				userEmail: SAMPLE_MESSAGE_ONE.userEmail,
				message: SAMPLE_MESSAGE_ONE.message,
			},
			[SAMPLE_MESSAGE_TWO.id]: {
				userEmail: SAMPLE_MESSAGE_TWO.userEmail,
				message: SAMPLE_MESSAGE_TWO.message,
			},
		}

		const stubInboxThen = (deleteResponse) => {
			const fetchMock = vi
				.fn()
				.mockResolvedValueOnce(okResponse(inbox))
				.mockResolvedValueOnce(deleteResponse)
			vi.stubGlobal('fetch', fetchMock)
			return fetchMock
		}

		it('removes only the deleted message from several', async () => {
			const fetchMock = stubInboxThen(okResponse(null))
			renderPage()
			await screen.findByText(SAMPLE_MESSAGE_ONE.message)
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(2)

			fireEvent.click(screen.getAllByTestId(MESSAGE_ITEM.DELETE)[0])

			await waitFor(() =>
				expect(
					screen.queryByText(SAMPLE_MESSAGE_ONE.message),
				).not.toBeInTheDocument(),
			)
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(1)
			expect(
				screen.getByText(SAMPLE_MESSAGE_TWO.message),
			).toBeInTheDocument()
			expect(fetchMock.mock.calls[1][0]).toContain(
				`/messages/me/${SAMPLE_MESSAGE_ONE.id}.json`,
			)
			expect(fetchMock.mock.calls[1][1]).toMatchObject({
				method: 'DELETE',
			})
		})

		it('keeps every message and shows an error dialog when the delete fails', async () => {
			stubInboxThen({ ok: false, json: async () => ({}) })
			renderPage()
			await screen.findByText(SAMPLE_MESSAGE_ONE.message)

			fireEvent.click(screen.getAllByTestId(MESSAGE_ITEM.DELETE)[0])

			expect(
				await screen.findByTestId(MESSAGE_ITEM.ERROR_DIALOG),
			).toBeInTheDocument()
			expect(screen.getAllByTestId(MESSAGE_ITEM.ROOT)).toHaveLength(2)
		})
	})
})
