import { render, screen, act } from '@testing-library/react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { GLOBAL } from '@/constants/ui'
import { MOCK_TRAVELLERS, TEST_IDS } from '@/constants/test'

import Travellers from '../Travellers'

import travellersStyles from '../travellers.module.scss'

vi.mock('react-redux', async () => {
	const actual = await vi.importActual('react-redux')
	return {
		...actual,
		useDispatch: vi.fn(),
		useSelector: vi.fn(),
	}
})

vi.mock('@/store/slices/travellersSlice', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		loadTravellers: vi.fn(),
		selectTravellers: vi.fn(),
		selectHasTravellers: vi.fn(),
		selectIsTraveller: vi.fn(),
	}
})

vi.mock('@/store/slices/authenticationSlice', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		...actual,
		selectIsAuthenticated: vi.fn(),
	}
})

import * as travellersSlice from '@/store/slices/travellersSlice'

const renderTravellers = (props = {}) => {
	let mockDispatch

	mockDispatch = vi.fn().mockResolvedValue({})
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
				<Travellers {...props} />
			</BrowserRouter>
		</Provider>,
	)

	return { ...result, mockDispatch }
}

/**
 * Travellers Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container and heading are rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the <h1> displays the correct text
 * - Uses isolated rendering to avoid external dependencies
 */

describe('Travellers', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const setupMocksForHasTravellers = () => {
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue(
			MOCK_TRAVELLERS.SAMPLE_TRAVELLERS,
		)
	}

	const setupMocksForNoTravellers = () => {
		vi.mocked(travellersSlice.selectTravellers).mockReturnValue([])
	}

	describe('Rendering tests', () => {
		it('renders the <main> element', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('applies both mainContainer and travellersContainer classes to <main>', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			const main = screen.getByTestId(TEST_IDS.MAIN_CONTAINER)
			expect(main.className).toMatch(GLOBAL.CLASS_NAMES.MAIN_CONTAINER)
			expect(main.className).toMatch(
				new RegExp(travellersStyles.travellersContainer),
			)
		})

		it('<main> element has correct data attributes', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			const main = screen.getByRole('main')
			expect(main).toHaveAttribute('data-cy', TEST_IDS.MAIN_CONTAINER)
			expect(main).toHaveAttribute(
				'data-cy-alt',
				TEST_IDS.TRAVELLERS.CONTAINER,
			)
		})

		it('renders the TravellersList component', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.CONTAINER),
			).toBeInTheDocument()
		})

		it('renders the TravellersList component if there are no travellers', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.CONTAINER),
			).toBeInTheDocument()
		})
	})
})
