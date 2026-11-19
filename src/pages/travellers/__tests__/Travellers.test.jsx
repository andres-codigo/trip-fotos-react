import { render, screen, act, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'
import { describe, it, expect, vi, afterEach } from 'vitest'

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
	const store = configureTestStore({
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

describe('Travellers', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	const setupMocksForHasTravellers = () => stubTravellers(SAMPLE_RECORDS)

	describe('Rendering tests', () => {
		it('renders the travellers list inside <main>', async () => {
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
			expect(
				screen.getByTestId(TEST_IDS.TRAVELLERS_LIST.LIST),
			).toBeInTheDocument()
		})

		it('shows the alert from location state, clears history state and drops the alert once closed', async () => {
			const replaceState = vi
				.spyOn(window.history, 'replaceState')
				.mockImplementation(() => {})
			setupMocksForHasTravellers()
			const alertMessage = 'Success Message'

			await act(async () => {
				renderTravellers({}, { alertMessage })
			})

			expect(screen.getByRole('alert')).toHaveTextContent(alertMessage)
			expect(replaceState).toHaveBeenCalledWith({}, document.title)
			replaceState.mockRestore()

			await act(async () => {
				fireEvent.click(screen.getByLabelText('Close message'))
			})
			await act(async () => {
				fireEvent.animationEnd(screen.getByRole('alert'))
			})
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('does not render alert when no alertMessage in state', async () => {
			setupMocksForHasTravellers()

			await act(async () => {
				renderTravellers({}, null)
			})

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})
	})
})
