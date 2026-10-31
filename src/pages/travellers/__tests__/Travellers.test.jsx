import { render, screen, act, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { TEST_IDS } from '@/constants/test'

import Travellers from '@/pages/travellers/Travellers'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const SAMPLE_RECORDS = {
	'traveller-1': {
		firstName: 'Ada',
		lastName: 'Lovelace',
		tripDescription: 'Paris in spring',
		daysInCity: 4,
		cities: ['tokyo'],
		files: [],
		registered: '2024-01-01T00:00:00.000Z',
	},
	'traveller-2': {
		firstName: 'Grace',
		lastName: 'Hopper',
		tripDescription: 'A week in Lisbon',
		daysInCity: 7,
		cities: ['lisbon'],
		files: [],
		registered: '2024-02-01T00:00:00.000Z',
	},
}

const stubTravellers = (records) =>
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ ok: true, json: async () => records }),
	)

const renderTravellers = (props = {}, locationState = null) => {
	const store = configureStore({
		reducer: {
			authentication: authenticationReducer,
			travellers: travellersReducer,
		},
		preloadedState: {
			authentication: {
				...authenticationReducer(undefined, { type: '@@init' }),
				token: 'token',
				userId: 'me',
			},
		},
	})

	const initialEntries = locationState
		? [{ pathname: '/travellers', state: locationState }]
		: ['/travellers']

	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={initialEntries}>
				<Travellers {...props} />
			</MemoryRouter>
		</Provider>,
	)
}

/**
 * Travellers Unit Tests
 *
 * Test Strategy:
 * - Focuses on rendering logic and correct application of CSS classes
 * - Verifies that the main container and heading are rendered as expected
 * - Ensures the <main> element has both global and module-specific classes
 * - Checks that the <h1> displays the correct text
 * - Renders with a real store and a stubbed fetch, so no selector needs mocking
 */

describe('Travellers', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	const setupMocksForHasTravellers = () => stubTravellers(SAMPLE_RECORDS)

	const setupMocksForNoTravellers = () => stubTravellers(null)

	describe('Rendering tests', () => {
		it('renders the <main> element', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(screen.getByRole('main')).toBeInTheDocument()
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
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
			).toBeInTheDocument()
			expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
			expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
		})

		it('renders the TravellersList component if there are no travellers', async () => {
			setupMocksForNoTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.NO_LIST),
			).toBeInTheDocument()
		})

		it('renders alert when alertMessage is present in location state', async () => {
			setupMocksForHasTravellers()
			const alertMessage = 'Success Message'

			await act(async () => {
				renderTravellers({}, { alertMessage })
			})

			const alert = screen.getByRole('alert')
			expect(alert).toBeInTheDocument()
			expect(alert).toHaveTextContent(alertMessage)
		})

		it('does not render alert when no alertMessage in state', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers({}, null)
			})

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})

	describe('Behaviour tests', () => {
		const originalReplaceState = window.history.replaceState

		beforeEach(() => {
			window.history.replaceState = vi.fn()
		})

		afterEach(() => {
			window.history.replaceState = originalReplaceState
		})

		it('clears history state when alert is present', async () => {
			setupMocksForHasTravellers()
			const alertMessage = 'Success Message'

			await act(async () => {
				renderTravellers({}, { alertMessage })
			})

			expect(window.history.replaceState).toHaveBeenCalledWith(
				{},
				document.title,
			)
		})

		it('closes alert when close button is clicked', async () => {
			setupMocksForHasTravellers()
			const alertMessage = 'Success Message'

			await act(async () => {
				renderTravellers({}, { alertMessage })
			})

			const closeButton = screen.getByLabelText('Close message')
			await act(async () => {
				fireEvent.click(closeButton)
			})

			const alert = screen.getByRole('alert')
			expect(alert).toBeInTheDocument()

			await act(async () => {
				fireEvent.animationEnd(alert)
			})

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})

	describe('Accessibility tests', () => {
		it('the main container has the correct role', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers()
			})

			expect(screen.getByRole('main')).toBeInTheDocument()
		})

		it('the alert component has the correct role', async () => {
			setupMocksForHasTravellers()
			const alertMessage = 'Success Message'

			await act(async () => {
				renderTravellers({}, { alertMessage })
			})

			expect(screen.getByRole('alert')).toBeInTheDocument()
		})
	})
})
