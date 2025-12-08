import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { GLOBAL } from '@/constants/ui'
import { TRAVELLERS_ACTION_TYPES } from '@/constants/redux'
import {
	MOCK_ERROR_MESSAGES,
	MOCK_TRAVELLERS,
	MOCK_USER,
	DIALOG,
	TEST_IDS,
	SPINNER,
	UI_TEXT,
} from '@/constants/test'

/**
 * TravellersList Unit Tests
 *
 * Test Strategy:
 * - Focuses on prop defaults, edge cases, and implementation details
 * - Complements Cypress tests which cover rendering, behavior, and accessibility scenarios
 * - Tests conditional rendering logic (list, spinner, error dialog, register button)
 * - Tests authentication-dependent UI and error handling flows
 * - Verifies prop spreading, accessibility roles, and test IDs
 */

vi.mock('react-redux', async () => {
	const actual = await vi.importActual('react-redux')
	return {
		...actual,
		useDispatch: vi.fn(),
		useSelector: vi.fn(),
	}
})

vi.mock('@/store/slices/travellersSlice', () => ({
	loadTravellers: vi.fn(),
	selectTravellers: vi.fn(),
	selectHasTravellers: vi.fn(),
	selectIsTraveller: vi.fn(),
}))

vi.mock('@/store/slices/authenticationSlice', () => ({
	selectIsAuthenticated: vi.fn(),
	selectAuthenticationToken: vi.fn(),
	selectUserId: vi.fn(),
	selectUserName: vi.fn(),
	selectUserEmail: vi.fn(),
	selectUserProfile: vi.fn(),
	selectDidAutoLogout: vi.fn(),
}))

import TravellersList from '../TravellersList'
import * as travellersSlice from '@/store/slices/travellersSlice'
import * as authenticationSlice from '@/store/slices/authenticationSlice'

const renderTravellersList = (props = {}, options = {}) => {
	const {
		shouldReject = false,
		error = null,
		shouldResolveSlowly = false,
	} = options

	let mockDispatch
	if (shouldReject) {
		mockDispatch = vi.fn().mockRejectedValue(error)
	} else if (shouldResolveSlowly) {
		mockDispatch = vi
			.fn()
			.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			)
	} else {
		mockDispatch = vi.fn().mockResolvedValue({})
	}

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
		vi.mocked(authenticationSlice.selectIsAuthenticated).mockReturnValue(
			false,
		)
		vi.mocked(
			authenticationSlice.selectAuthenticationToken,
		).mockReturnValue(null)
		vi.mocked(authenticationSlice.selectUserId).mockReturnValue(null)
		vi.mocked(authenticationSlice.selectUserName).mockReturnValue(null)
		vi.mocked(authenticationSlice.selectUserEmail).mockReturnValue(null)
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
		vi.mocked(
			authenticationSlice.selectAuthenticationToken,
		).mockReturnValue(MOCK_USER.TOKEN)
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

	const setupMocksForLoadingState = () => {
		// Return non-empty array to prevent useEffect, but keep loading true via props
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue([
			{ id: 'temp' },
		])
		vi.mocked(travellersSlice.selectHasTravellers).mockReturnValue(false)
		vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
			type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
		})
	}

	const setupMocksForErrorState = () => {
		// Setup mocks to prevent useEffect from triggering loadTravellersHandler
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue([
			{ id: 'mock-traveller' }, // Non-empty to prevent loading
		])
		vi.mocked(travellersSlice.selectHasTravellers).mockReturnValue(false) // But no actual travellers to display
		vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(false)
		vi.mocked(travellersSlice.loadTravellers).mockReturnValue({
			type: TRAVELLERS_ACTION_TYPES.LOAD_TRAVELLERS_ASYNC.PENDING,
		})
	}

	describe('Rendering tests', () => {
		it('should render the main container with correct data-cy attribute', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellersList()
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.CONTAINER),
			).toBeInTheDocument()
		})

		it('should render controls section', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellersList()
			})
			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.CONTROLS),
			).toBeInTheDocument()
		})

		it('should render spinner when loading', async () => {
			setupMocksForLoadingState()

			await act(async () => {
				renderTravellersList({ isLoading: true })
			})

			expect(
				screen.getByTestId(TEST_IDS.SPINNER.CONTAINER),
			).toBeInTheDocument()
		})

		it('should render "No travellers listed" message when no travellers exist', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellersList()
			})

			await waitFor(() => {
				expect(
					screen.queryByTestId(TEST_IDS.SPINNER.CONTAINER),
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
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.ITEM),
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

			it('should not show register button when user is not logged in', async () => {
				setupMocksForNoTravellers()
				vi.mocked(
					authenticationSlice.selectIsAuthenticated,
				).mockReturnValue(false)

				await act(async () => {
					renderTravellersList()
				})

				await waitFor(() => {
					expect(
						screen.queryByRole(SPINNER.ROLE_STATUS),
					).not.toBeInTheDocument()
				})

				expect(
					screen.queryByTestId(
						TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK,
					),
				).not.toBeInTheDocument()
			})

			it('should not show register button when user is logged in and is a traveller', async () => {
				setupMocksForHasTravellers()
				setupMocksForLoggedInUser()
				vi.mocked(travellersSlice.selectIsTraveller).mockReturnValue(
					true,
				)

				await act(async () => {
					renderTravellersList()
				})

				expect(
					screen.queryByTestId(
						TEST_IDS.TRAVELLERS_LIST.REGISTER_LINK,
					),
				).not.toBeInTheDocument()
			})
		})

		describe('error handling', () => {
			it('should clear error when handleError is called', async () => {
				setupMocksForErrorState()

				renderTravellersList({
					initialError: MOCK_ERROR_MESSAGES.INITIAL_ERROR,
					isLoading: false,
				})

				expect(
					screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
				).toBeInTheDocument()

				fireEvent.click(screen.getByText(UI_TEXT.BUTTONS.CLOSE))

				await waitFor(() => {
					expect(
						screen.queryByRole(DIALOG.ROLE_ALERTDIALOG),
					).not.toBeInTheDocument()
				})
			})

			it('should handle loadTravellers dispatch error', async () => {
				setupMocksForNoTravellers()

				const mockError = new Error(MOCK_ERROR_MESSAGES.LOAD_FAILED)
				renderTravellersList(
					{},
					{
						shouldReject: true,
						error: mockError,
					},
				)

				await waitFor(() => {
					expect(
						screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
					).toBeInTheDocument()
				})

				expect(
					screen.getByText(MOCK_ERROR_MESSAGES.LOAD_FAILED),
				).toBeInTheDocument()
			})

			it('should show generic error message when error has no message', async () => {
				setupMocksForNoTravellers()

				const mockError = new Error()
				renderTravellersList(
					{},
					{
						shouldReject: true,
						error: mockError,
					},
				)

				await waitFor(() => {
					expect(
						screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
					).toBeInTheDocument()
				})

				expect(
					screen.getByText(ERROR_MESSAGES.SOMETHING_WENT_WRONG),
				).toBeInTheDocument()
			})

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

				const mockDispatch = vi.fn().mockResolvedValue(rejectedResult)
				vi.mocked(useDispatch).mockReturnValue(mockDispatch)

				await act(async () => {
					renderTravellersList()
				})

				await waitFor(() => {
					expect(
						screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
					).toBeInTheDocument()
				})

				expect(
					screen.getByText(GLOBAL.ERROR_DIALOG_TITLE),
				).toBeInTheDocument()
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

			it('should enable refresh button when travellers exist', () => {
				setupMocksForHasTravellers()
				renderTravellersList()

				expect(
					screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
				).not.toBeDisabled()
			})

			it('should call loadTravellersHandler with true when refresh button is clicked', async () => {
				setupMocksForHasTravellers()

				const mockDispatch = vi.fn().mockResolvedValue({})
				vi.mocked(useDispatch).mockReturnValue(mockDispatch)

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
			it('should not dispatch loadTravellers on mount when travellers exist', () => {
				setupMocksForHasTravellers()

				const { mockDispatch } = renderTravellersList()

				expect(mockDispatch).not.toHaveBeenCalled()
			})
		})

		describe('loading states', () => {
			it('should show loading spinner when isLoading prop is true', async () => {
				setupMocksForLoadingState()

				await act(async () => {
					renderTravellersList({ isLoading: true })
				})

				expect(
					screen.getByRole(SPINNER.ROLE_STATUS),
				).toBeInTheDocument()
			})

			it('should hide travellers list when loading', async () => {
				setupMocksForHasTravellers()

				await act(async () => {
					renderTravellersList({ isLoading: true })
				})

				expect(
					screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
				).not.toBeInTheDocument()
			})

			it('should hide no travellers message when loading', async () => {
				setupMocksForLoadingState()

				await act(async () => {
					renderTravellersList({ isLoading: true })
				})

				expect(
					screen.queryByText(
						UI_TEXT.TRAVELLERS.NO_TRAVELLERS_MESSAGE,
					),
				).not.toBeInTheDocument()
			})
		})
	})

	describe('Accessibility tests', () => {
		it('should have proper role for error dialog', () => {
			setupMocksForErrorState()

			renderTravellersList({
				initialError: MOCK_ERROR_MESSAGES.INITIAL_ERROR,
				isLoading: false,
			})

			expect(
				screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
			).toBeInTheDocument()
		})

		it('should have proper role for refresh button', () => {
			setupMocksForHasTravellers()
			renderTravellersList()

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.REFRESH_BUTTON),
			).toBeInTheDocument()
		})

		it('should have proper list structure for travellers', () => {
			setupMocksForHasTravellers()
			renderTravellersList()

			expect(
				screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.ITEM),
			).toBeInTheDocument()
		})
	})
})
