import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { BADGE, IMAGE, TRAVELLER_DETAIL } from '@/constants/test'

import TravellerDetail from '@/pages/traveller-detail/TravellerDetail'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'a'.repeat(300),
	daysInCity: 7,
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	files: Array.from({ length: 7 }, (_, i) => `https://img/${i}.jpg`),
}

const stubFetch = ({ data = traveller, ok = true } = {}) =>
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ ok, json: async () => data }),
	)

const renderPage = ({
	id = 'abc',
	userId = 'me',
	isTraveller = false,
	hash = '',
} = {}) => {
	const store = configureStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				userId,
			},
			travellers: {
				...travellersReducer(undefined, { type: '@@init' }),
				isTraveller,
			},
		},
	})

	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[`/travellers/${id}${hash}`]}>
				<Routes>
					<Route
						path="/travellers/:id"
						element={<TravellerDetail />}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	)
}

describe('<TravellerDetail />', () => {
	beforeEach(() => stubFetch())
	afterEach(() => vi.unstubAllGlobals())

	it('shows a spinner and a placeholder heading while loading', () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise(() => {})),
		)
		renderPage()
		expect(screen.getByTestId(TRAVELLER_DETAIL.SPINNER)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Traveller',
		)
	})

	it('renders the full profile and all photos', async () => {
		renderPage()
		expect(
			await screen.findByRole('heading', {
				level: 1,
				name: 'Ada Lovelace',
			}),
		).toBeInTheDocument()
		expect(
			screen.getByTestId(TRAVELLER_DETAIL.TRIP_DESCRIPTION).textContent,
		).toBe('a'.repeat(300))
		expect(screen.getByTestId(TRAVELLER_DETAIL.DAYS)).toHaveTextContent(
			'Days in city: 7 days',
		)
		expect(screen.getAllByTestId(IMAGE.ID)).toHaveLength(7)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.SPINNER),
		).not.toBeInTheDocument()
	})

	describe('Photos anchor', () => {
		const scrollIntoView = vi.fn()

		beforeEach(() => {
			scrollIntoView.mockClear()
			Element.prototype.scrollIntoView = scrollIntoView
		})

		afterEach(() => {
			delete Element.prototype.scrollIntoView
		})

		it('scrolls to the photos once the traveller has loaded', async () => {
			renderPage({ hash: '#photos' })
			const list = await screen.findByTestId(TRAVELLER_DETAIL.IMAGES_LIST)
			expect(list).toHaveAttribute('id', 'photos')
			// The scroll runs in an effect, which can flush after the list appears
			await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
			expect(scrollIntoView.mock.contexts[0]).toBe(list)
		})

		it('does not scroll without the photos hash', async () => {
			renderPage()
			await screen.findByTestId(TRAVELLER_DETAIL.IMAGES_LIST)
			expect(scrollIntoView).not.toHaveBeenCalled()
		})

		it('does not scroll for an unrelated hash', async () => {
			renderPage({ hash: '#other' })
			await screen.findByTestId(TRAVELLER_DETAIL.IMAGES_LIST)
			expect(scrollIntoView).not.toHaveBeenCalled()
		})
	})

	it('omits the photo list without files', async () => {
		stubFetch({ data: { ...traveller, files: [] } })
		renderPage()
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.IMAGES_LIST),
		).not.toBeInTheDocument()
	})

	it('renders cities as City, Country including legacy ids', async () => {
		renderPage()
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		const badges = screen.getAllByTestId(BADGE.ID)
		expect(badges).toHaveLength(2)
		expect(badges[0]).toHaveTextContent('Tokyo, Japan')
		expect(badges[0].className).toMatch(/\bbg-badge-\d\b/)
		expect(badges[1]).toHaveTextContent('Paris, France')
		expect(badges[1].className).toMatch(/\bbg-badge-\d\b/)
	})

	it('shows the contact link for a traveller viewing someone else', async () => {
		renderPage({ isTraveller: true })
		expect(
			await screen.findByRole('heading', {
				level: 2,
				name: 'Send Ada a message',
			}),
		).toBeInTheDocument()
		expect(screen.getByTestId(TRAVELLER_DETAIL.CONTACT)).toHaveAttribute(
			'href',
			'/travellers/abc/contact',
		)
	})

	it('hides the contact section on the own record', async () => {
		renderPage({ userId: 'abc', isTraveller: true })
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.CONTACT_SECTION),
		).not.toBeInTheDocument()
	})

	it('hides the contact section for non-travellers', async () => {
		renderPage()
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.CONTACT_SECTION),
		).not.toBeInTheDocument()
	})

	it('shows the not-found state for an unknown id', async () => {
		stubFetch({ data: null })
		renderPage({ id: 'nope' })
		expect(
			await screen.findByText('Traveller not found.'),
		).toBeInTheDocument()
		expect(screen.getByTestId(TRAVELLER_DETAIL.BACK_LINK)).toHaveAttribute(
			'href',
			'/travellers',
		)
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Traveller',
		)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.PROFILE),
		).not.toBeInTheDocument()
	})

	// There is no separate error view yet, so a failed load shares the not-found state
	describe('when the load is rejected', () => {
		it.each([
			['a server error', () => stubFetch({ ok: false, data: {} })],
			[
				'a network failure',
				() =>
					vi.stubGlobal(
						'fetch',
						vi
							.fn()
							.mockRejectedValue(
								new TypeError('Failed to fetch'),
							),
					),
			],
		])(
			'shows the not-found state with a way back after %s',
			async (_, arrange) => {
				arrange()
				renderPage()

				expect(
					await screen.findByTestId(TRAVELLER_DETAIL.NOT_FOUND),
				).toHaveTextContent('Traveller not found.')
				expect(
					screen.getByTestId(TRAVELLER_DETAIL.BACK_LINK),
				).toHaveAttribute('href', '/travellers')
				expect(
					screen.queryByTestId(TRAVELLER_DETAIL.PROFILE),
				).not.toBeInTheDocument()
				expect(
					screen.queryByTestId(TRAVELLER_DETAIL.SPINNER),
				).not.toBeInTheDocument()
			},
		)
	})
})
