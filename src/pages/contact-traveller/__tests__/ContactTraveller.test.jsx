import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CONTACT_TRAVELLER } from '@/constants/test'
import { CONTACT_TRAVELLER_CONFIG } from '@/constants/travellers'

import ContactTraveller from '@/pages/contact-traveller/ContactTraveller'
import authenticationReducer from '@/store/slices/authenticationSlice'
import messagesReducer from '@/store/slices/messagesSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const TravellersStub = () => {
	const location = useLocation()
	return <p>{location.state?.alertMessage}</p>
}

const renderPage = ({
	travellers = [],
	isTraveller = true,
	isTravellerCheckedFor = 'me',
	id = 'abc',
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
				userEmail: 'me@example.com',
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
			<MemoryRouter initialEntries={[`/travellers/${id}/contact`]}>
				<Routes>
					<Route
						path="/travellers/:id/contact"
						element={<ContactTraveller />}
					/>
					<Route
						path="/travellers"
						element={<TravellersStub />}
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

	it('falls back to a generic heading and prefills the user email', () => {
		renderPage()
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			CONTACT_TRAVELLER_CONFIG.FALLBACK_TITLE,
		)
		expect(screen.getByTestId(CONTACT_TRAVELLER.EMAIL_INPUT)).toHaveValue(
			'me@example.com',
		)
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
			await screen.findByText(CONTACT_TRAVELLER_CONFIG.SUCCESS_MESSAGE),
		).toBeInTheDocument()
		const [url, options] = fetchMock.mock.calls[0]
		expect(url).toContain('/messages/abc.json')
		expect(JSON.parse(options.body)).toEqual({
			userEmail: 'me@example.com',
			message: 'Hello',
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
})
