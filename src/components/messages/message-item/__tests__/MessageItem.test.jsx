import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { MESSAGE_ITEM, MOCK_INBOX } from '@/constants/test'

import MessageItem from '@/components/messages/message-item/MessageItem'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'

const { SAMPLE_MESSAGE_ONE } = MOCK_INBOX

const renderItem = () => {
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
			messages: {
				...messagesReducer(undefined, { type: '@@init' }),
				messages: [SAMPLE_MESSAGE_ONE],
			},
		},
	})

	render(
		<Provider store={store}>
			<ul>
				<MessageItem
					id={SAMPLE_MESSAGE_ONE.id}
					email={SAMPLE_MESSAGE_ONE.userEmail}
					message={SAMPLE_MESSAGE_ONE.message}
				/>
			</ul>
		</Provider>,
	)

	return store
}

describe('<MessageItem />', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('shows the sender email as a mailto link and the message text', () => {
		renderItem()

		const email = screen.getByTestId(MESSAGE_ITEM.EMAIL)
		expect(email).toHaveTextContent(SAMPLE_MESSAGE_ONE.userEmail)
		expect(email).toHaveAttribute(
			'href',
			`mailto:${SAMPLE_MESSAGE_ONE.userEmail}`,
		)
		expect(screen.getByTestId(MESSAGE_ITEM.TEXT)).toHaveTextContent(
			SAMPLE_MESSAGE_ONE.message,
		)
	})

	it('deletes the message and removes it from the store', async () => {
		let resolveFetch
		const fetchMock = vi.fn(
			() => new Promise((resolve) => (resolveFetch = resolve)),
		)
		vi.stubGlobal('fetch', fetchMock)
		const store = renderItem()

		fireEvent.click(screen.getByTestId(MESSAGE_ITEM.DELETE))

		expect(
			await screen.findByTestId(MESSAGE_ITEM.SPINNER),
		).toBeInTheDocument()
		resolveFetch({ ok: true, json: async () => null })

		await vi.waitFor(() =>
			expect(store.getState().messages.messages).toHaveLength(0),
		)
		const [url, options] = fetchMock.mock.calls[0]
		expect(url).toContain(
			`/messages/me/${SAMPLE_MESSAGE_ONE.id}.json?auth=token`,
		)
		expect(options.method).toBe('DELETE')
	})

	it('shows an error dialog and restores the item when deleting fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
		)
		renderItem()

		fireEvent.click(screen.getByTestId(MESSAGE_ITEM.DELETE))

		expect(
			await screen.findByTestId(MESSAGE_ITEM.ERROR_DIALOG),
		).toHaveTextContent(ERROR_MESSAGES.REQUEST_ERROR)
		expect(screen.getByTestId(MESSAGE_ITEM.ROOT)).toBeInTheDocument()
	})
})
