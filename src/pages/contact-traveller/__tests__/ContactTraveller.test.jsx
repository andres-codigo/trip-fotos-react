import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_DATABASE } from '@/constants/api'
import { CONTACT_TRAVELLER } from '@/constants/test'
import {
	CONTACT_TRAVELLER_CONFIG,
	MESSAGES_CONFIG,
} from '@/constants/travellers'
import { PATHS } from '@/constants/ui'

import ContactTraveller from '@/pages/contact-traveller/ContactTraveller'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const AlertStub = ({ page }) => {
	const location = useLocation()
	return (
		<p>
			{page}: {location.state?.alertMessage}
		</p>
	)
}

const FIVE_MINUTES_AGO = () => Date.now() - 5 * 60 * 1000

const replyTo = (overrides = {}) => ({
	name: 'Jane Smith',
	message: 'Loved your Lisbon photos.',
	createdAt: FIVE_MINUTES_AGO(),
	...overrides,
})

const renderPage = ({
	travellers = [],
	isTraveller = true,
	isTravellerCheckedFor = 'me',
	id = 'abc',
	state,
} = {}) => {
	const store = configureStore({
		reducer: {
			authentication: authenticationReducer,
			messages: messagesReducer,
			travellers: travellersReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId: 'me',
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				travellers,
				isTraveller,
				isTravellerCheckedFor,
			},
		},
	})

	return render(
		<Provider store={store}>
			<MemoryRouter
				initialEntries={[
					{ pathname: `/travellers/${id}/contact`, state },
				]}>
				<Routes>
					<Route
						path="/travellers/:id/contact"
						element={<ContactTraveller />}
					/>
					<Route
						path="/travellers"
						element={<AlertStub page="Travellers" />}
					/>
					<Route
						path={PATHS.MESSAGES}
						element={<AlertStub page="Messages" />}
					/>
					<Route
						path="/travellers/:id"
						element={<p>Traveller detail</p>}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	)
}

const sendMessage = () => {
	fireEvent.change(screen.getByTestId(CONTACT_TRAVELLER.MESSAGE_INPUT), {
		target: { value: 'Hello' },
	})
	fireEvent.click(screen.getByTestId(CONTACT_TRAVELLER.SUBMIT))
}

describe('<ContactTraveller />', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('redirects to the detail page when the record is the user’s own', () => {
		renderPage({ id: 'me' })
		expect(screen.getByText('Traveller detail')).toBeInTheDocument()
		expect(
			screen.queryByTestId(CONTACT_TRAVELLER.ROOT),
		).not.toBeInTheDocument()
	})

	it('redirects to the detail page when the user is not a traveller', () => {
		renderPage({ isTraveller: false })
		expect(screen.getByText('Traveller detail')).toBeInTheDocument()
		expect(
			screen.queryByTestId(CONTACT_TRAVELLER.ROOT),
		).not.toBeInTheDocument()
	})

	it('waits for the traveller check before judging access', () => {
		renderPage({ isTraveller: false, isTravellerCheckedFor: null })
		expect(screen.queryByText('Traveller detail')).not.toBeInTheDocument()
		expect(
			screen.queryByTestId(CONTACT_TRAVELLER.ROOT),
		).not.toBeInTheDocument()
	})

	it('names the traveller when they are already in the store', () => {
		renderPage({ travellers: [{ id: 'abc', firstName: 'Ada' }] })
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			CONTACT_TRAVELLER_CONFIG.TITLE('Ada'),
		)
	})

	it('falls back to a generic heading, with no reply quote or back link', () => {
		renderPage()
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			CONTACT_TRAVELLER_CONFIG.FALLBACK_TITLE,
		)
		expect(
			screen.queryByTestId(CONTACT_TRAVELLER.REPLY_QUOTE),
		).not.toBeInTheDocument()
		expect(
			screen.queryByTestId(CONTACT_TRAVELLER.BACK_TO_MESSAGES),
		).not.toBeInTheDocument()
	})

	it('has no email field', () => {
		renderPage()
		expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument()
	})

	it('posts the message and returns to travellers with a success alert', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ name: 'new-id' }),
		})
		vi.stubGlobal('fetch', fetchMock)
		renderPage()

		sendMessage()

		expect(
			await screen.findByText(
				`Travellers: ${CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE}`,
			),
		).toBeInTheDocument()
		const [url, options] = fetchMock.mock.calls[0]
		expect(url).toContain('/messages/abc.json')
		expect(JSON.parse(options.body)).toEqual({
			senderId: 'me',
			message: 'Hello',
			createdAt: API_DATABASE.SERVER_TIMESTAMP,
			read: false,
		})
	})

	it('shows an error dialog when sending fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
		)
		renderPage()

		sendMessage()

		expect(
			await screen.findByTestId(CONTACT_TRAVELLER.ERROR_DIALOG),
		).toBeInTheDocument()
		expect(screen.getByTestId(CONTACT_TRAVELLER.FORM)).toBeInTheDocument()
	})

	describe('reply mode', () => {
		it('titles the page with the sender name from the message', () => {
			renderPage({
				travellers: [{ id: 'abc', firstName: 'Ada', lastName: 'Lee' }],
				state: { replyTo: replyTo() },
			})
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.REPLY_TITLE('Jane Smith'),
			)
		})

		it('falls back to the traveller’s full name from the store', () => {
			renderPage({
				travellers: [{ id: 'abc', firstName: 'Ada', lastName: 'Lee' }],
				state: { replyTo: replyTo({ name: null }) },
			})
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.REPLY_TITLE('Ada Lee'),
			)
		})

		it('falls back to the generic title when no name is known', () => {
			renderPage({ state: { replyTo: replyTo({ name: null }) } })
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.FALLBACK_TITLE,
			)
		})

		it('quotes the message it answers with the sender and time', () => {
			renderPage({ state: { replyTo: replyTo() } })
			const quote = screen.getByTestId(CONTACT_TRAVELLER.REPLY_QUOTE)
			expect(quote.tagName).toBe('BLOCKQUOTE')
			expect(quote).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.REPLY_QUOTE('Jane Smith', '5 min ago'),
			)
			expect(quote).toHaveTextContent('Loved your Lisbon photos.')
		})

		it('quotes without a time for an undated message', () => {
			renderPage({ state: { replyTo: replyTo({ createdAt: null }) } })
			expect(
				screen.getByTestId(CONTACT_TRAVELLER.REPLY_QUOTE),
			).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.REPLY_QUOTE('Jane Smith', null),
			)
		})

		it('names an unknown sender generically in the quote', () => {
			renderPage({ state: { replyTo: replyTo({ name: null }) } })
			expect(
				screen.getByTestId(CONTACT_TRAVELLER.REPLY_QUOTE),
			).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.REPLY_QUOTE(
					MESSAGES_CONFIG.UNKNOWN_TRAVELLER,
					'5 min ago',
				),
			)
		})

		it('shows no quote when the reply carries no message text', () => {
			renderPage({ state: { replyTo: replyTo({ message: '' }) } })
			expect(
				screen.queryByTestId(CONTACT_TRAVELLER.REPLY_QUOTE),
			).not.toBeInTheDocument()
			expect(
				screen.getByTestId(CONTACT_TRAVELLER.BACK_TO_MESSAGES),
			).toBeInTheDocument()
		})

		it('links back to Messages', () => {
			renderPage({ state: { replyTo: replyTo() } })
			const back = screen.getByTestId(CONTACT_TRAVELLER.BACK_TO_MESSAGES)
			expect(back).toHaveAttribute('href', PATHS.MESSAGES)
			expect(back).toHaveTextContent(
				CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES,
			)

			// The visible text must be the accessible name, not BaseButton's generic 'Link'
			expect(back).toHaveAccessibleName(
				CONTACT_TRAVELLER_CONFIG.BACK_TO_MESSAGES,
			)

			fireEvent.click(back)
			expect(screen.getByText(/^Messages:/)).toBeInTheDocument()
		})

		it('returns to Messages with the reply alert after sending', async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ name: 'new-id' }),
			})
			vi.stubGlobal('fetch', fetchMock)
			renderPage({ state: { replyTo: replyTo() } })

			sendMessage()

			expect(
				await screen.findByText(
					`Messages: ${CONTACT_TRAVELLER_CONFIG.REPLY_SUCCESS_MESSAGE}`,
				),
			).toBeInTheDocument()
			expect(fetchMock.mock.calls[0][0]).toContain('/messages/abc.json')
		})

		it('stays on the reply form with an error dialog when sending fails', async () => {
			vi.stubGlobal(
				'fetch',
				vi
					.fn()
					.mockResolvedValue({ ok: false, json: async () => ({}) }),
			)
			renderPage({ state: { replyTo: replyTo() } })

			sendMessage()

			expect(
				await screen.findByTestId(CONTACT_TRAVELLER.ERROR_DIALOG),
			).toBeInTheDocument()
			expect(
				screen.getByTestId(CONTACT_TRAVELLER.REPLY_QUOTE),
			).toBeInTheDocument()
		})
	})
})
