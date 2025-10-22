import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { TRAVELLERS_ACTION_TYPES } from '@/constants/action-types'
import {
	MOCK_MESSAGES,
	MOCK_TRAVELLERS,
	MOCK_USER,
} from '@/constants/test/mock-data'
import { DIALOG } from '@/constants/test/dialog'
import { TEST_IDS } from '@/constants/test/selectors'
import { SPINNER } from '@/constants/test/spinner'
import { UI_TEXT } from '@/constants/test/ui-text'

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

			expect(screen.getByRole('status')).toBeInTheDocument()
		})

		it('should render "No travellers listed" message when no travellers exist', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellersList()
			})

			await waitFor(() => {
				expect(screen.queryByRole('status')).not.toBeInTheDocument()
			})

			expect(
				screen.getByText('No travellers listed.'),
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
				setupMocksForNoTravellers()

				renderTravellersList({
					initialError: MOCK_MESSAGES.TEST_ERROR,
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

				const mockError = new Error(MOCK_MESSAGES.LOAD_FAILED)
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
					screen.getByText(MOCK_MESSAGES.LOAD_FAILED),
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
					screen.getByText(MOCK_MESSAGES.SOMETHING_WENT_WRONG),
				).toBeInTheDocument()
			})
		})

		describe('refresh functionality', () => {
			it('should disable refresh button when no travellers and not loading', async () => {
				setupMocksForNoTravellers()
				renderTravellersList()

				await waitFor(() => {
					expect(
						screen.queryByRole(SPINNER.ROLE_STATUS),
					).not.toBeInTheDocument()
				})

				const refreshButton = screen.getByRole('button', {
					name: /refresh/i,
				})

				expect(refreshButton).toBeDisabled()
			})

			it('should enable refresh button when travellers exist', () => {
				setupMocksForHasTravellers()
				renderTravellersList()

				const refreshButton = screen.getByRole('button', {
					name: /refresh/i,
				})

				expect(refreshButton).not.toBeDisabled()
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
			it('should show loading spinner when isLoading prop is true', () => {
				setupMocksForNoTravellers()
				renderTravellersList({ isLoading: true })

				expect(
					screen.getByRole(SPINNER.ROLE_STATUS),
				).toBeInTheDocument()
			})

			it('should hide travellers list when loading', () => {
				setupMocksForHasTravellers()
				renderTravellersList({ isLoading: true })

				expect(
					screen.queryByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
				).not.toBeInTheDocument()
			})

			it('should hide no travellers message when loading', () => {
				setupMocksForNoTravellers()
				renderTravellersList({ isLoading: true })

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
			setupMocksForNoTravellers()
			renderTravellersList({ initialError: MOCK_MESSAGES.TEST_ERROR })

			expect(
				screen.getByRole(DIALOG.ROLE_ALERTDIALOG),
			).toBeInTheDocument()
		})

		it('should have proper role for refresh button', () => {
			setupMocksForHasTravellers()
			renderTravellersList()

			expect(
				screen.getByRole('button', { name: /refresh/i }),
			).toBeInTheDocument()
		})

		it('should have proper list structure for travellers', () => {
			setupMocksForHasTravellers()
			renderTravellersList()

			expect(screen.getByRole('list')).toBeInTheDocument()
			expect(screen.getByRole('listitem')).toBeInTheDocument()
		})
	})
})
