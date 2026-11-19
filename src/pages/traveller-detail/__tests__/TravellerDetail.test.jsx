import { act, render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { TRAVELLER_DETAIL_CONFIG } from '@/constants/travellers'
import {
	BADGE,
	COMMON_SELECTORS,
	IMAGE,
	TRAVELLER_DETAIL,
} from '@/constants/test'

import TravellerDetail from '@/pages/traveller-detail/TravellerDetail'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'a'.repeat(300),
	tripStart: '2024-12-28',
	tripEnd: '2025-01-03',
	registered: '2025-01-10T09:00:00.000Z',
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
	search = '',
	hash = '',
	state = null,
} = {}) => {
	const store = configureTestStore({
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
			<MemoryRouter
				initialEntries={[
					{ pathname: `/travellers/${id}`, search, hash, state },
				]}>
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

	it('ignores a load that settles after the page has gone', async () => {
		let respond
		vi.stubGlobal(
			'fetch',
			vi.fn(
				() =>
					new Promise((resolve) => {
						respond = resolve
					}),
			),
		)
		const { unmount } = renderPage()
		await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
		unmount()

		await act(async () => {
			respond({ ok: true, json: async () => traveller })
		})
	})

	it('tags your own trip "You" after the name, and nobody else\'s', async () => {
		const { unmount } = renderPage({ userId: 'abc' })
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		const name = screen.getByTestId(TRAVELLER_DETAIL.NAME)
		expect(name.nextElementSibling).toHaveTextContent(/^You$/)
		unmount()

		renderPage({ userId: 'someone-else' })
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		expect(screen.queryByText('You')).not.toBeInTheDocument()
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
		const trip = screen.getByTestId(TRAVELLER_DETAIL.TRIP)
		expect(trip).toHaveTextContent('28 Dec 2024 – 3 Jan 2025')
		expect(trip).toHaveTextContent('7 days')
		expect(
			screen.queryByText(/Registered|10 Jan 2025/),
		).not.toBeInTheDocument()
		expect(screen.getAllByTestId(IMAGE.ID)).toHaveLength(7)
		expect(
			screen.getByRole('heading', { level: 2, name: 'Photos' }),
		).toBeInTheDocument()
		expect(screen.getByText('7 photos')).toBeInTheDocument()
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.SPINNER),
		).not.toBeInTheDocument()
	})

	it('shows only the length for an older traveller with no trip dates', async () => {
		stubFetch({
			data: {
				...traveller,
				tripStart: undefined,
				tripEnd: undefined,
				daysInCity: '5',
			},
		})
		renderPage()
		expect(
			await screen.findByTestId(TRAVELLER_DETAIL.TRIP),
		).toHaveTextContent('Trip: 5 days')
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
			const heading = await screen.findByTestId(
				TRAVELLER_DETAIL.PHOTOS_HEADING,
			)
			const anchor = heading.closest('#photos')
			expect(anchor).toContainElement(
				screen.getByTestId(TRAVELLER_DETAIL.IMAGES_LIST),
			)
			// The scroll runs in an effect, which can flush after the list appears
			await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
			expect(scrollIntoView.mock.contexts[0]).toBe(anchor)
		})

		it.each([
			['without a hash', undefined],
			['for an unrelated hash', '#other'],
		])('does not scroll %s', async (_, hash) => {
			renderPage({ hash })
			await screen.findByTestId(TRAVELLER_DETAIL.IMAGES_LIST)
			expect(scrollIntoView).not.toHaveBeenCalled()
		})
	})

	it('serves the stored thumbnails to the photo tiles', async () => {
		stubFetch({
			data: {
				...traveller,
				fileThumbnails: [
					[{ width: 320, url: 'https://img/0-320w.jpg' }],
				],
			},
		})
		renderPage()
		const tiles = await screen.findAllByTestId(IMAGE.THUMBNAIL)
		expect(tiles[0]).toHaveAttribute(
			'srcset',
			'https://img/0-320w.jpg 320w',
		)
		expect(tiles[1]).toHaveAttribute('src', 'https://img/1.jpg')
	})

	it('describes a photo with its saved alt text', async () => {
		stubFetch({
			data: {
				...traveller,
				fileAlts: { 1: 'Shibuya crossing at night' },
			},
		})
		renderPage()
		const tiles = await screen.findAllByTestId(IMAGE.THUMBNAIL)

		expect(tiles[1]).toHaveAttribute('alt', 'Shibuya crossing at night')
		expect(tiles[0]).toHaveAttribute('alt', "Ada Lovelace's photo")
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
		expect(badges[1]).toHaveTextContent('Paris, France')
	})

	it('offers Message {first name} in the profile for a traveller viewing someone else', async () => {
		renderPage({ isTraveller: true })
		const profile = await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		const message = screen.getByRole('link', { name: 'Message Ada' })
		expect(profile).toContainElement(message)
		expect(message).toHaveAttribute('href', '/messages/abc_me')
	})

	it('hides the Message icon from assistive technology', async () => {
		renderPage({ isTraveller: true })
		const message = await screen.findByRole('link', { name: 'Message Ada' })
		expect(message.querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true',
		)
	})

	it('opens the photo named in the URL', async () => {
		renderPage({ search: '?photo=3' })
		await screen.findByRole('dialog')
		expect(screen.getByTestId(IMAGE.COUNTER)).toHaveTextContent('3 of 7')
		expect(screen.getByTestId(IMAGE.FULL)).toHaveAttribute(
			'src',
			'https://img/2.jpg',
		)
	})

	it.each([
		['on the own record', { userId: 'abc', isTraveller: true }],
		['for non-travellers', {}],
	])('hides Message %s', async (_, options) => {
		renderPage(options)
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.MESSAGE),
		).not.toBeInTheDocument()
	})

	it('links back to Travellers above the profile', async () => {
		renderPage()
		const profile = await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
		const back = screen.getByRole('link', { name: 'Back to travellers' })
		expect(back).toHaveAttribute('href', '/travellers')
		expect(
			back.compareDocumentPosition(profile) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy()
	})

	it('shows no back link while loading', async () => {
		renderPage()
		expect(
			screen.queryByTestId(TRAVELLER_DETAIL.BACK_TO_TRAVELLERS),
		).not.toBeInTheDocument()
		await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)
	})

	describe('Own trip actions', () => {
		it('offers Edit trip and Add photos on the own record', async () => {
			renderPage({ userId: 'abc' })
			await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)

			expect(screen.getByTestId(TRAVELLER_DETAIL.EDIT)).toHaveAttribute(
				'href',
				'/travellers/abc/edit',
			)
			expect(
				screen.getByTestId(TRAVELLER_DETAIL.ADD_PHOTOS),
			).toHaveAttribute('href', '/travellers/abc/edit#photos')
		})

		it("offers neither on someone else's record", async () => {
			renderPage({ isTraveller: true })
			await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)

			expect(
				screen.queryByTestId(TRAVELLER_DETAIL.EDIT),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(TRAVELLER_DETAIL.ADD_PHOTOS),
			).not.toBeInTheDocument()
		})

		it('shows an own trip with no photos as such, with its own Add photos', async () => {
			stubFetch({ data: { ...traveller, files: undefined } })
			renderPage({ userId: 'abc' })
			const empty = await screen.findByTestId(TRAVELLER_DETAIL.NO_PHOTOS)

			expect(empty).toHaveTextContent(
				TRAVELLER_DETAIL_CONFIG.NO_PHOTOS_MESSAGE,
			)
			expect(
				screen.getByRole('heading', {
					level: 2,
					name: TRAVELLER_DETAIL_CONFIG.PHOTOS_HEADING,
				}),
			).toBeInTheDocument()
			expect(
				screen.getAllByRole('link', {
					name: TRAVELLER_DETAIL_CONFIG.ADD_PHOTOS_LABEL,
				}),
			).toHaveLength(2)
			expect(
				within(empty).getByRole('link', {
					name: TRAVELLER_DETAIL_CONFIG.ADD_PHOTOS_LABEL,
				}),
			).toBeInTheDocument()
		})

		it("says nothing about missing photos on someone else's trip", async () => {
			stubFetch({ data: { ...traveller, files: undefined } })
			renderPage()
			await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)

			expect(
				screen.queryByTestId(TRAVELLER_DETAIL.NO_PHOTOS),
			).not.toBeInTheDocument()
		})

		it('shows the saved alert it was sent with', async () => {
			renderPage({
				userId: 'abc',
				state: { alertMessage: 'Your trip has been saved.' },
			})

			const alert = await screen.findByTestId(
				TRAVELLER_DETAIL.SAVED_ALERT,
			)
			expect(alert).toHaveTextContent('Your trip has been saved.')
			// Inside the profile card, as on Travellers, so it is no wider than the cards
			expect(alert.closest(COMMON_SELECTORS.BASE_CARD)).toContainElement(
				screen.getByTestId(TRAVELLER_DETAIL.PROFILE),
			)
		})

		it('shows no alert on a plain visit', async () => {
			renderPage({ userId: 'abc' })
			await screen.findByTestId(TRAVELLER_DETAIL.PROFILE)

			expect(
				screen.queryByTestId(TRAVELLER_DETAIL.SAVED_ALERT),
			).not.toBeInTheDocument()
		})
	})

	// There is no separate error view yet, so a failed load shares the not-found state
	describe('when the traveller cannot be shown', () => {
		it.each([
			['an unknown id', () => stubFetch({ data: null }), { id: 'nope' }],
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
			async (_, arrange, options = {}) => {
				arrange()
				renderPage(options)

				expect(
					await screen.findByTestId(TRAVELLER_DETAIL.NOT_FOUND),
				).toHaveTextContent('Traveller not found.')
				expect(
					screen.getByTestId(TRAVELLER_DETAIL.BACK_TO_TRAVELLERS),
				).toHaveAttribute('href', '/travellers')
				expect(
					screen.getByRole('heading', { level: 1 }),
				).toHaveTextContent('Traveller')
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
