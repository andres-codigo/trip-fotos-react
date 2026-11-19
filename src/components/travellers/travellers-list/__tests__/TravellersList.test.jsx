import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
	within,
} from '@testing-library/react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { GLOBAL } from '@/constants/ui'
import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import {
	TRAVELLER_FILTER_CONFIG,
	TRAVELLERS_LIST_CONFIG,
	TRAVELLERS_WELCOME_CONFIG,
} from '@/constants/travellers'
import {
	MOCK_CITIES,
	MOCK_ERROR_MESSAGES,
	MOCK_TRAVELLERS,
	MOCK_USER,
	PUBLIC_TRAVELLER_ITEM,
	TEST_IDS,
	TRAVELLER_ITEM,
	TRAVELLER_SKELETON,
	SPINNER,
	UI_TEXT,
} from '@/constants/test'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('@/store/slices/travellersSlice', () => ({
	// A real thunk has rejected.match; without it the happy path throws and opens the error dialog
	loadTravellers: Object.assign(vi.fn(), {
		rejected: { match: () => false },
	}),
	loadPublicTrips: Object.assign(vi.fn(), {
		rejected: { match: () => false },
	}),
	selectPublicTrips: vi.fn(),
	selectTravellers: vi.fn(),
	selectHasTravellers: vi.fn(),
	selectIsTraveller: vi.fn(),
	selectIsTravellerKnown: vi.fn(),
	selectLastFetch: vi.fn(),
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	selectIsAuthenticated: vi.fn(),
	selectUserId: vi.fn(),
	selectUserName: vi.fn(),
	selectUserEmail: vi.fn(),
	selectUserProfile: vi.fn(),
}))

// A pass-through spy, so one test can force the zero-results guard the real hook never reaches
vi.mock(
	'@/components/travellers/travellers-list/hooks/useCityFilter',
	async (importOriginal) => {
		const actual = await importOriginal()
		return { default: vi.fn(actual.default) }
	},
)

vi.mock('@/components/travellers/traveller-item/TravellerItem', async () => {
	const { TRAVELLER_ITEM } = await import('@/constants/test')
	return {
		default: () => <li data-cy={TRAVELLER_ITEM.ROOT}>Traveller item</li>,
	}
})

vi.mock(
	'@/components/travellers/public-traveller-item/PublicTravellerItem',
	async () => {
		const { PUBLIC_TRAVELLER_ITEM } = await import('@/constants/test')
		return {
			default: () => (
				<li data-cy={PUBLIC_TRAVELLER_ITEM.ROOT}>
					Public traveller item
				</li>
			),
		}
	},
)

import TravellersList from '@/components/travellers/travellers-list/TravellersList'
import useCityFilter from '@/components/travellers/travellers-list/hooks/useCityFilter'

const ALERT_ROLE = 'alert'
import * as travellersSlice from '@/store/slices/travellersSlice'
import * as authenticationSlice from '@/store/slices/authenticationSlice'

const renderTravellersList = (
	props = {},
	mockDispatch = vi.fn().mockResolvedValue({}),
) => {
	const mockStore = {
		getState: () => ({}),
		dispatch: mockDispatch,
		subscribe: () => () => {},
	}

	vi.mocked(useDispatch).mockReturnValue(mockDispatch)
	vi.mocked(useSelector).mockImplementation((selector) => {
		return selector()
	})

	const result = render(
		<Provider store={mockStore}>
			<BrowserRouter>
				<TravellersList {...props} />
			</BrowserRouter>
		</Provider>,
	)

	return { ...result, mockDispatch }
}

describe('<TravellersList />', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(travellersSlice.loadTravellers).rejected = {
			match: () => false,
		}
		vi.mocked(travellersSlice.loadPublicTrips).rejected = {
			match: () => false,
		}
		// Signed in by default: most of these tests are about the full list
		vi.mocked(authenticationSlice.selectIsAuthenticated).mockReturnValue(
			true,
		)
		vi.mocked(travellersSlice.selectPublicTrips).mockReturnValue([])
		vi.mocked(authenticationSlice.selectUserId).mockReturnValue(null)
		vi.mocked(authenticationSlice.selectUserName).mockReturnValue(null)
		vi.mocked(authenticationSlice.selectUserEmail).mockReturnValue(null)
		vi.mocked(travellersSlice.selectIsTravellerKnown).mockReturnValue(true)
		vi.mocked(travellersSlice.selectLastFetch).mockReturnValue(1)
	})

	const setupMocksForHasTravellers = () => {
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue(
			MOCK_TRAVELLERS.SAMPLE_TRAVELLERS,
		)
		vi.mocked(travellersSlice.selectHasTravellers).mockReturnValue(true)
		vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
			type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
		})
	}

	const setupMocksForNoTravellers = () => {
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue([])
		vi.mocked(travellersSlice.selectHasTravellers).mockReturnValue(false)
		vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
			type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
		})
	}

	const setupMocksForLoggedInUser = () => {
		vi.mocked(authenticationSlice.selectIsAuthenticated).mockReturnValue(
			true,
		)
		vi.mocked(authenticationSlice.selectUserId).mockReturnValue(
			MOCK_USER.ID,
		)
		vi.mocked(authenticationSlice.selectUserName).mockReturnValue(
			MOCK_USER.NAME,
		)
		vi.mocked(authenticationSlice.selectUserEmail).mockReturnValue(
			MOCK_USER.EMAIL,
		)
	}

	// A non-empty list stops the mount load, so isLoading and initialError come from props alone
	const setupMocksForPropState = () => {
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue([
			{ id: 'mock-traveller' },
		])
		vi.mocked(travellersSlice.selectHasTravellers).mockReturnValue(false)
		vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
			type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
		})
	}

	describe('Rendering tests', () => {
		it('should show the loading label and disable Refresh when loading', async () => {
			setupMocksForPropState()

			await act(async () => {
				renderTravellersList({ isLoading: true })
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.LOADING),
			).toHaveTextContent(TRAVELLERS_LIST_CONFIG.LOADING_LABEL)
			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
			).toBeDisabled()
		})

		it('should render "No travellers listed" message when no travellers exist', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellersList()
			})

			await waitFor(() => {
				expect(
					screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LOADING),
				).not.toBeInTheDocument()
			})

			expect(
				screen.getByText(UI_TEXT.TRAVELLERS.NO_TRAVELLERS_MESSAGE),
			).toBeInTheDocument()
		})

		it('should render travellers list when travellers exist', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellersList()
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
			).toBeInTheDocument()
			expect(
				screen.getAllByTestId(TEST_IDS.TRAVELLERS_LIST.ITEM)[0],
			).toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		describe('authentication-dependent rendering', () => {
			it('should show register button when user is logged in and not a traveller', async () => {
				setupMocksForNoTravellers()
				setupMocksForLoggedInUser()
				vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(
					false,
				)

				await act(async () => {
					renderTravellersList()
				})

				await waitFor(() => {
					expect(
						screen.queryByRole(SPINNER.ROLE_STATUS),
					).not.toBeInTheDocument()
				})

				expect(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK),
				).toBeInTheDocument()
				expect(
					screen.getByText(UI_TEXT.TRAVELLERS.REGISTER_AS_TRAVELLER),
				).toBeInTheDocument()
			})

			it.each([
				[
					'while the traveller check is pending',
					() =>
						vi
							.mocked(travellersSlice.selectIsTravellerKnown)
							.mockReturnValue(false),
				],
				[
					'when the user is not logged in',
					() =>
						vi
							.mocked(authenticationSlice.selectIsAuthenticated)
							.mockReturnValue(false),
				],
				[
					'when the user is already a traveller',
					() =>
						vi
							.mocked(travellersSlice.selectIsTraveller)
							.mockReturnValue(true),
				],
			])('should not show register button %s', async (_, arrange) => {
				setupMocksForNoTravellers()
				setupMocksForLoggedInUser()
				arrange()

				await act(async () => {
					renderTravellersList()
				})

				expect(
					screen.queryByTestId(
						TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK,
					),
				).not.toBeInTheDocument()
			})

			it('should disable register button when loading', async () => {
				setupMocksForPropState()
				setupMocksForLoggedInUser()
				vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(
					false,
				)

				await act(async () => {
					renderTravellersList({ isLoading: true })
				})

				const registerButton = screen.getByTestId(
					TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK,
				)
				expect(registerButton).toBeInTheDocument()
				expect(registerButton).toHaveAttribute('aria-disabled', 'true')
			})
		})

		describe('error handling', () => {
			it('should reload and clear the inline error when Try again is pressed', async () => {
				setupMocksForPropState()

				renderTravellersList({
					initialError: MOCK_ERROR_MESSAGES.INITIAL_ERROR,
					isLoading: false,
				})

				const alert = screen.getByRole(ALERT_ROLE)
				expect(alert).toHaveTextContent(
					TRAVELLERS_LIST_CONFIG.LOAD_ERROR_TITLE,
				)
				expect(alert).toHaveTextContent(
					MOCK_ERROR_MESSAGES.INITIAL_ERROR,
				)
				expect(
					screen.queryByText(
						UI_TEXT.TRAVELLERS.NO_TRAVELLERS_MESSAGE,
					),
				).not.toBeInTheDocument()

				fireEvent.click(
					screen.getByRole('button', {
						name: TRAVELLERS_LIST_CONFIG.TRY_AGAIN,
					}),
				)

				expect(travellersSlice.loadTravellers).toHaveBeenCalledWith({
					forceRefresh: true,
				})

				await waitFor(() => {
					expect(
						screen.queryByRole(ALERT_ROLE),
					).not.toBeInTheDocument()
				})
			})

			it.each([
				[
					MOCK_ERROR_MESSAGES.LOAD_FAILED,
					MOCK_ERROR_MESSAGES.LOAD_FAILED,
				],
				[undefined, ERROR_MESSAGES.SOMETHING_WENT_WRONG],
			])(
				'should show the dispatch error %s, or a generic message',
				async (message, shown) => {
					setupMocksForNoTravellers()

					renderTravellersList(
						{},
						vi.fn().mockRejectedValue(new Error(message)),
					)

					expect(
						await screen.findByRole(ALERT_ROLE),
					).toHaveTextContent(shown)
				},
			)

			it('should handle loadTravellers rejection with payload', async () => {
				setupMocksForNoTravellers()

				const rejectedResult = {
					type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC
						.REJECTED,
					payload: GLOBAL.ERROR_DIALOG_TITLE,
				}

				vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
					type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
				})

				vi.mocked(travellersSlice.loadTravellers).rejected = {
					match: vi.fn().mockReturnValue(true),
				}

				await act(async () => {
					renderTravellersList(
						{},
						vi.fn().mockResolvedValue(rejectedResult),
					)
				})

				await waitFor(() => {
					expect(screen.getByRole(ALERT_ROLE)).toBeInTheDocument()
				})

				expect(screen.getByRole(ALERT_ROLE)).toHaveTextContent(
					TRAVELLERS_LIST_CONFIG.LOAD_ERROR_TITLE,
				)
			})
		})

		describe('refresh functionality', () => {
			it('should render refresh button when no travellers', async () => {
				setupMocksForNoTravellers()
				renderTravellersList()

				await waitFor(() => {
					expect(
						screen.queryByRole(SPINNER.ROLE_STATUS),
					).not.toBeInTheDocument()
				})

				expect(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
				).toBeInTheDocument()
				expect(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
				).not.toBeDisabled()
			})

			it('should call loadTravellersHandler with true when refresh button is clicked', async () => {
				setupMocksForHasTravellers()

				await act(async () => {
					renderTravellersList()
				})

				const refreshButton = screen.getByTestId(
					TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON,
				)
				fireEvent.click(refreshButton)

				await waitFor(() => {
					expect(travellersSlice.loadTravellers).toHaveBeenCalledWith(
						expect.objectContaining({ forceRefresh: true }),
					)
				})
			})
		})

		describe('component lifecycle', () => {
			it('should load behind the spinner when the cached travellers have not been fetched this page load', async () => {
				setupMocksForHasTravellers()
				vi.mocked(travellersSlice.selectLastFetch).mockReturnValue(null)

				renderTravellersList()

				expect(
					screen.getByRole(SPINNER.ROLE_STATUS),
				).toBeInTheDocument()
				expect(
					screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
				).not.toBeInTheDocument()

				await act(async () => {})
			})

			it('should revalidate cached travellers on mount without showing the spinner', async () => {
				setupMocksForHasTravellers()

				let mockDispatch
				await act(async () => {
					;({ mockDispatch } = renderTravellersList())
				})

				expect(mockDispatch).toHaveBeenCalledTimes(1)
				expect(travellersSlice.loadTravellers).toHaveBeenCalledWith({
					forceRefresh: false,
				})
				expect(
					screen.queryByRole(SPINNER.ROLE_STATUS),
				).not.toBeInTheDocument()
			})
		})
	})

	describe('Accessibility tests', () => {
		it('should name the icon-only refresh button', async () => {
			setupMocksForHasTravellers()
			await act(async () => {
				renderTravellersList()
			})

			const refreshButton = screen.getByRole('button', {
				name: UI_TEXT.TRAVELLERS.REFRESH_BUTTON,
			})
			expect(refreshButton.querySelector('svg')).toHaveAttribute(
				'aria-hidden',
				'true',
			)
		})

		it('should keep the heading, refresh and register in the title row', async () => {
			setupMocksForHasTravellers()
			setupMocksForLoggedInUser()
			vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
			await act(async () => {
				renderTravellersList()
			})

			const controls = screen.getByTestId(
				TEST_IDS.TRAVELLERS_LIST.CONTROLS,
			)
			expect(controls).toContainElement(
				screen.getByRole('heading', { level: 1, name: 'Travellers' }),
			)
			expect(controls).toContainElement(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
			)
			expect(controls).toContainElement(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK),
			)
		})
	})

	describe('City filter', () => {
		const TRAVELLERS_WITH_CITIES = [
			{
				...MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE,
				cities: [MOCK_CITIES.TOKYO],
			},
			{
				...MOCK_TRAVELLERS.SAMPLE_TRAVELLER_TWO,
				cities: [MOCK_CITIES.PRAGUE, MOCK_CITIES.TOKYO],
			},
		]

		const setupMocksForTravellersWithCities = () => {
			setupMocksForHasTravellers()
			vi.mocked(travellersSlice.selectTravellers).mockReturnValue(
				TRAVELLERS_WITH_CITIES,
			)
		}

		const getCheckbox = (city) =>
			screen.getByRole('checkbox', {
				name: `${city.city}, ${city.country}`,
			})

		const getItems = () =>
			screen.getAllByTestId(TEST_IDS.TRAVELLERS_LIST.ITEM)
		const getShowAll = () =>
			screen.getByRole('button', {
				name: TRAVELLER_FILTER_CONFIG.SHOW_ALL,
			})

		afterEach(async () => {
			const actual = await vi.importActual(
				'@/components/travellers/travellers-list/hooks/useCityFilter',
			)
			vi.mocked(useCityFilter).mockImplementation(actual.default)
		})

		it('should filter the cards by the ticked cities and show them all again on Show all cities', async () => {
			setupMocksForTravellersWithCities()
			await act(async () => {
				renderTravellersList()
			})

			expect(screen.getAllByRole('checkbox')).toHaveLength(2)
			expect(getItems()).toHaveLength(2)

			fireEvent.click(getCheckbox(MOCK_CITIES.PRAGUE))
			expect(getItems()).toHaveLength(1)

			fireEvent.click(getShowAll())
			expect(getItems()).toHaveLength(2)
			expect(getCheckbox(MOCK_CITIES.PRAGUE)).not.toBeChecked()
		})

		it('should show the zero-results card with a Show all cities reset', async () => {
			setupMocksForTravellersWithCities()
			const showAllCities = vi.fn()
			vi.mocked(useCityFilter).mockImplementation(() => ({
				options: [{ id: 'hobart', label: 'Hobart' }],
				selectedIds: ['hobart'],
				isFiltered: true,
				toggleCity: vi.fn(),
				showAllCities,
				filteredTravellers: [],
			}))
			await act(async () => {
				renderTravellersList()
			})

			expect(
				screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
			).not.toBeInTheDocument()
			const card = screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.NO_MATCHES)
			expect(card).toHaveAttribute('role', 'status')
			expect(card).toHaveTextContent(
				TRAVELLER_FILTER_CONFIG.NO_RESULTS_TITLE,
			)

			fireEvent.click(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.SHOW_ALL_CITIES),
			)
			expect(showAllCities).toHaveBeenCalledTimes(1)
		})

		it('should not render the filter when no traveller has a city', async () => {
			setupMocksForHasTravellers()
			await act(async () => {
				renderTravellersList()
			})

			expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
		})
	})

	describe('Paging', () => {
		const PAGE_SIZE = TRAVELLERS_LIST_CONFIG.PAGE_SIZE

		const makeTravellers = (count, cityFor = () => MOCK_CITIES.TOKYO) =>
			Array.from({ length: count }, (_, index) => ({
				...MOCK_TRAVELLERS.SAMPLE_TRAVELLER_ONE,
				id: `traveller-${index}`,
				cities: [cityFor(index)],
			}))

		const setupMocksForManyTravellers = (travellers) => {
			setupMocksForHasTravellers()
			vi.mocked(travellersSlice.selectTravellers).mockReturnValue(
				travellers,
			)
		}

		const getItems = () =>
			screen.getAllByTestId(TEST_IDS.TRAVELLERS_LIST.ITEM)
		const getShowMore = () =>
			screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.SHOW_MORE)
		const getStatus = () =>
			screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.PAGE_STATUS)

		it('should add a page, move focus to the first new card and update the status', async () => {
			setupMocksForManyTravellers(makeTravellers(30))
			await act(async () => {
				renderTravellersList()
			})

			fireEvent.click(getShowMore())

			const items = getItems()
			expect(items).toHaveLength(PAGE_SIZE * 2)
			expect(items[PAGE_SIZE]).toHaveFocus()
			expect(items[PAGE_SIZE]).toHaveAttribute('tabindex', '-1')
			expect(getStatus()).toHaveAttribute('aria-live', 'polite')
			expect(getStatus()).toHaveTextContent(
				TRAVELLERS_LIST_CONFIG.PAGE_STATUS(PAGE_SIZE * 2, 30, false),
			)

			fireEvent.click(getShowMore())
			expect(getItems()[PAGE_SIZE * 2]).toHaveFocus()
			expect(getStatus()).toHaveTextContent(
				TRAVELLERS_LIST_CONFIG.ALL_SHOWN(30, false),
			)
		})

		it('should count matching travellers and go back to the first page when the filter changes', async () => {
			setupMocksForManyTravellers(
				makeTravellers(30, (index) =>
					index % 2 ? MOCK_CITIES.PRAGUE : MOCK_CITIES.TOKYO,
				),
			)
			await act(async () => {
				renderTravellersList()
			})

			fireEvent.click(getShowMore())
			expect(getItems()).toHaveLength(PAGE_SIZE * 2)

			fireEvent.click(
				screen.getByRole('checkbox', {
					name: `${MOCK_CITIES.PRAGUE.city}, ${MOCK_CITIES.PRAGUE.country}`,
				}),
			)

			expect(getItems()).toHaveLength(PAGE_SIZE)
			expect(getStatus()).toHaveTextContent(
				TRAVELLERS_LIST_CONFIG.PAGE_STATUS(PAGE_SIZE, 15, true),
			)
		})

		it('should go back to the first page on Refresh', async () => {
			setupMocksForManyTravellers(makeTravellers(30))
			await act(async () => {
				renderTravellersList()
			})

			fireEvent.click(getShowMore())
			expect(getItems()).toHaveLength(PAGE_SIZE * 2)

			await act(async () => {
				fireEvent.click(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
				)
			})

			expect(getItems()).toHaveLength(PAGE_SIZE)
		})

		it('should keep the cards shown when a Refresh fails', async () => {
			setupMocksForManyTravellers(makeTravellers(30))
			let mockDispatch
			await act(async () => {
				;({ mockDispatch } = renderTravellersList())
			})

			mockDispatch.mockRejectedValueOnce(
				new Error(MOCK_ERROR_MESSAGES.LOAD_FAILED),
			)
			await act(async () => {
				fireEvent.click(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
				)
			})

			expect(screen.getByRole(ALERT_ROLE)).toHaveTextContent(
				MOCK_ERROR_MESSAGES.LOAD_FAILED,
			)
			expect(getItems()).toHaveLength(PAGE_SIZE)
		})
	})

	describe('Logged out', () => {
		const PUBLIC_TRIPS = [
			{ id: 'amara', firstName: 'Amara', cities: ['prague'] },
			{ id: 'kofi', firstName: 'Kofi', cities: ['tokyo'] },
		]

		beforeEach(() => {
			vi.mocked(
				authenticationSlice.selectIsAuthenticated,
			).mockReturnValue(false)
			vi.mocked(travellersSlice.selectTravellers).mockReturnValue(
				MOCK_TRAVELLERS.SAMPLE_TRAVELLERS,
			)
			vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		})

		const renderLoaded = async () => {
			await act(async () => {
				renderTravellersList()
			})
			await waitFor(() => {
				expect(
					screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LOADING),
				).not.toBeInTheDocument()
			})
		}

		it('shows the welcome band and the public cards, never the full records', async () => {
			vi.mocked(travellersSlice.selectPublicTrips).mockReturnValue(
				PUBLIC_TRIPS,
			)

			await renderLoaded()

			expect(
				screen.getByRole('region', {
					name: TRAVELLERS_WELCOME_CONFIG.TITLE,
				}),
			).toBeInTheDocument()
			expect(
				screen.getAllByTestId(PUBLIC_TRAVELLER_ITEM.ROOT),
			).toHaveLength(PUBLIC_TRIPS.length)
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.ROOT),
			).not.toBeInTheDocument()
			expect(travellersSlice.loadPublicTrips).toHaveBeenCalled()
			expect(travellersSlice.loadTravellers).not.toHaveBeenCalled()
			expect(
				screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK),
			).not.toBeInTheDocument()
		})

		it('stands public-shaped skeletons in while the preview loads', () => {
			renderTravellersList(
				{},
				vi.fn(() => new Promise(() => {})),
			)

			const [skeleton] = screen.getAllByTestId(TRAVELLER_SKELETON.ROOT)
			// The public excerpt is clamped to two lines; the signed-in description runs to five
			expect(
				within(skeleton).getByTestId(TRAVELLER_SKELETON.TEXT).children,
			).toHaveLength(2)
		})

		it('filters the public cards by city', async () => {
			vi.mocked(travellersSlice.selectPublicTrips).mockReturnValue(
				PUBLIC_TRIPS,
			)

			await renderLoaded()
			fireEvent.click(screen.getByRole('checkbox', { name: /prague/i }))

			expect(
				screen.getAllByTestId(PUBLIC_TRAVELLER_ITEM.ROOT),
			).toHaveLength(1)
		})

		it('says there are no trips yet, with no Refresh, when the list is empty', async () => {
			await renderLoaded()

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.NO_PUBLIC_TRIPS),
			).toHaveTextContent(TRAVELLERS_LIST_CONFIG.NO_PUBLIC_TRIPS_TITLE)
			expect(
				screen.queryByRole('button', {
					name: UI_TEXT.TRAVELLERS.REFRESH_BUTTON,
				}),
			).not.toBeInTheDocument()
			expect(
				screen.queryByText(UI_TEXT.TRAVELLERS.NO_TRAVELLERS_MESSAGE),
			).not.toBeInTheDocument()
			expect(
				screen.getByRole('region', {
					name: TRAVELLERS_WELCOME_CONFIG.TITLE,
				}),
			).toBeInTheDocument()
		})

		it('keeps the welcome band when the public list fails to load', async () => {
			vi.mocked(travellersSlice.loadPublicTrips).rejected = {
				match: () => true,
			}

			await renderLoaded()

			expect(screen.getByRole(ALERT_ROLE)).toHaveTextContent(
				TRAVELLERS_LIST_CONFIG.LOAD_ERROR_TITLE,
			)
			expect(
				screen.getByRole('region', {
					name: TRAVELLERS_WELCOME_CONFIG.TITLE,
				}),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.NO_PUBLIC_TRIPS),
			).not.toBeInTheDocument()
		})

		it('swaps to the public list when the user logs out on the page', async () => {
			vi.mocked(
				authenticationSlice.selectIsAuthenticated,
			).mockReturnValue(true)
			const { rerender } = renderTravellersList()
			await waitFor(() =>
				expect(travellersSlice.loadTravellers).toHaveBeenCalled(),
			)

			vi.mocked(
				authenticationSlice.selectIsAuthenticated,
			).mockReturnValue(false)
			vi.mocked(travellersSlice.selectPublicTrips).mockReturnValue(
				PUBLIC_TRIPS,
			)
			await act(async () => {
				rerender(
					<Provider
						store={{
							getState: () => ({}),
							dispatch: vi.fn(),
							subscribe: () => () => {},
						}}>
						<BrowserRouter>
							<TravellersList />
						</BrowserRouter>
					</Provider>,
				)
			})

			await waitFor(() =>
				expect(travellersSlice.loadPublicTrips).toHaveBeenCalledWith({
					forceRefresh: true,
				}),
			)
		})
	})
})
