import { useState } from 'react'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import configureTestStore from '@/testUtils/configureTestStore'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { EDIT_TRIP, TRAVELLER_DETAIL } from '@/constants/test'
import { ERROR_MESSAGES } from '@/constants/errors'
import { EDIT_TRIP_CONFIG } from '@/constants/travellers'

import EditTrip from '@/pages/edit-trip/EditTrip'
import authenticationReducer from '@/store/slices/authenticationSlice'
import travellersReducer from '@/store/slices/travellersSlice'

const { mockUpdate, mockDelete } = vi.hoisted(() => ({
	mockUpdate: vi.fn(),
	mockDelete: vi.fn(),
}))

vi.mock('@/store/slices/travellersSlice', async (importOriginal) => {
	const actual = await importOriginal()
	const { createAsyncThunk } = await import('@reduxjs/toolkit')
	const settle =
		(fn) =>
		async (arg, { rejectWithValue }) => {
			try {
				return await fn(arg)
			} catch (error) {
				return rejectWithValue(error)
			}
		}
	return {
		...actual,
		updateTraveller: createAsyncThunk('test/update', settle(mockUpdate)),
		deleteTraveller: createAsyncThunk('test/delete', settle(mockDelete)),
	}
})

// The real form is covered by its own tests; this stand-in keeps local edits so a remount would show
vi.mock(
	'@/components/forms/traveller-registration/TravellerRegistrationForm',
	() => ({
		default: function MockForm({
			isLoading,
			onSubmit,
			initialTraveller,
			title,
			submitLabel,
			actions,
			focusPhotos,
		}) {
			const [firstName, setFirstName] = useState(
				initialTraveller.firstName,
			)
			return (
				<form
					data-cy="mock-form"
					data-loading={String(Boolean(isLoading))}
					data-focus-photos={String(Boolean(focusPhotos))}
					onSubmit={(event) => {
						event.preventDefault()
						onSubmit({ firstName })
					}}>
					<h1>{title}</h1>
					<label>
						First name
						<input
							value={firstName}
							onChange={(event) =>
								setFirstName(event.target.value)
							}
						/>
					</label>
					{actions}
					<button type="submit">{submitLabel}</button>
				</form>
			)
		},
	}),
)

const traveller = {
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'A long trip.',
	tripStart: '2024-12-28',
	tripEnd: '2025-01-03',
	cities: ['tokyo'],
	files: ['https://img/0.jpg', 'https://img/1.jpg'],
	fileThumbnails: [{ url: 'https://img/0-t.jpg' }],
}

const stubFetch = ({ data = traveller } = {}) =>
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ ok: true, json: async () => data }),
	)

const LocationProbe = () => {
	const location = useLocation()
	return (
		<div data-cy="probe">
			{location.pathname}|{location.state?.alertMessage ?? ''}
		</div>
	)
}

const renderPage = ({ id = 'me', userId = 'me', hash = '' } = {}) => {
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
		},
	})

	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[`/travellers/${id}/edit${hash}`]}>
				<Routes>
					<Route
						path="/travellers/:id/edit"
						element={<EditTrip />}
					/>
					<Route
						path="/travellers/:id"
						element={<LocationProbe />}
					/>
					<Route
						path="/travellers"
						element={<LocationProbe />}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	)
}

const openDeleteDialog = async () => {
	fireEvent.click(await screen.findByTestId(EDIT_TRIP.DELETE))
	return screen.findByTestId(EDIT_TRIP.DELETE_DIALOG)
}

describe('<EditTrip />', () => {
	beforeEach(() => {
		stubFetch()
		mockUpdate.mockReset()
		mockDelete.mockReset()
	})
	afterEach(() => vi.unstubAllGlobals())

	it("redirects to the traveller's detail page for another user's id", async () => {
		renderPage({ id: 'someone-else' })
		expect(await screen.findByTestId('probe')).toHaveTextContent(
			'/travellers/someone-else|',
		)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('shows a spinner and a hidden heading while loading', () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => new Promise(() => {})),
		)
		renderPage()
		expect(screen.getByTestId(TRAVELLER_DETAIL.SPINNER)).toBeInTheDocument()
		expect(screen.getByRole('heading', { level: 1 })).toHaveClass('sr-only')
		expect(screen.queryByTestId('mock-form')).not.toBeInTheDocument()
	})

	it('shows the not-found card when the record is missing', async () => {
		stubFetch({ data: null })
		renderPage()
		expect(
			await screen.findByTestId(TRAVELLER_DETAIL.NOT_FOUND),
		).toHaveTextContent('Traveller not found.')
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
		expect(screen.queryByTestId('mock-form')).not.toBeInTheDocument()
	})

	it('prefills the form, links back to the trip and has one h1', async () => {
		renderPage()
		expect(await screen.findByLabelText('First name')).toHaveValue('Ada')
		expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			EDIT_TRIP_CONFIG.TITLE,
		)
		expect(screen.getByTestId(EDIT_TRIP.BACK_TO_TRIP)).toHaveAttribute(
			'href',
			'/travellers/me',
		)
		expect(screen.getByTestId(EDIT_TRIP.CANCEL)).toHaveAttribute(
			'href',
			'/travellers/me',
		)
		expect(screen.getByTestId('mock-form')).toHaveAttribute(
			'data-focus-photos',
			'false',
		)
		expect(screen.getByTestId(EDIT_TRIP.DELETE_SECTION)).toHaveTextContent(
			EDIT_TRIP_CONFIG.DELETE_SUMMARY(2),
		)
	})

	it('asks the form to focus the photos for the photos anchor', async () => {
		renderPage({ hash: '#photos' })
		expect(await screen.findByTestId('mock-form')).toHaveAttribute(
			'data-focus-photos',
			'true',
		)
	})

	it('saves and returns to the trip with the saved alert', async () => {
		let resolve
		mockUpdate.mockReturnValue(
			new Promise((r) => {
				resolve = r
			}),
		)
		renderPage()
		fireEvent.change(await screen.findByLabelText('First name'), {
			target: { value: 'Grace' },
		})
		fireEvent.click(screen.getByText(EDIT_TRIP_CONFIG.SAVE_LABEL))

		expect(
			await screen.findByTestId(EDIT_TRIP.SAVING_DIALOG),
		).toHaveTextContent(EDIT_TRIP_CONFIG.SAVING_MESSAGE)
		expect(mockUpdate).toHaveBeenCalledWith({ firstName: 'Grace' })

		resolve({ ...traveller, id: 'me', firstName: 'Grace' })
		expect(await screen.findByTestId('probe')).toHaveTextContent(
			`/travellers/me|${EDIT_TRIP_CONFIG.SAVED_MESSAGE}`,
		)
	})

	it('shows the error dialog on a failed save and keeps the edits', async () => {
		mockUpdate.mockRejectedValue('Upload failed.')
		renderPage()
		fireEvent.change(await screen.findByLabelText('First name'), {
			target: { value: 'Grace' },
		})
		fireEvent.click(screen.getByText(EDIT_TRIP_CONFIG.SAVE_LABEL))

		expect(
			await screen.findByTestId(EDIT_TRIP.ERROR_DIALOG),
		).toHaveTextContent('Upload failed.')
		expect(
			screen.queryByTestId(EDIT_TRIP.SAVING_DIALOG),
		).not.toBeInTheDocument()
		expect(screen.getByLabelText('First name')).toHaveValue('Grace')
	})

	it('falls back to the save error message for an unknown failure', async () => {
		mockUpdate.mockRejectedValue(null)
		renderPage()
		fireEvent.click(await screen.findByText(EDIT_TRIP_CONFIG.SAVE_LABEL))

		expect(
			await screen.findByTestId(EDIT_TRIP.ERROR_DIALOG),
		).toHaveTextContent(ERROR_MESSAGES.FAILED_TO_SAVE_TRIP)
	})

	it('opens the delete dialog with Cancel focused and returns focus on cancel', async () => {
		renderPage()
		const dialog = await openDeleteDialog()

		expect(dialog).toHaveTextContent(EDIT_TRIP_CONFIG.DELETE_DIALOG_TITLE)
		expect(dialog).toHaveTextContent(
			EDIT_TRIP_CONFIG.DELETE_DIALOG_MESSAGE(2),
		)
		const cancel = within(dialog).getByTestId(EDIT_TRIP.DELETE_CANCEL)
		await waitFor(() => expect(cancel).toHaveFocus())

		fireEvent.click(cancel)
		await waitFor(() =>
			expect(
				screen.queryByTestId(EDIT_TRIP.DELETE_DIALOG),
			).not.toBeInTheDocument(),
		)
		await waitFor(() =>
			expect(screen.getByTestId(EDIT_TRIP.DELETE)).toHaveFocus(),
		)
		expect(mockDelete).not.toHaveBeenCalled()
	})

	it('deletes the profile and goes to Travellers with the deleted alert', async () => {
		let resolve
		mockDelete.mockReturnValue(
			new Promise((r) => {
				resolve = r
			}),
		)
		renderPage()
		const dialog = await openDeleteDialog()
		fireEvent.click(within(dialog).getByTestId(EDIT_TRIP.DELETE_CONFIRM))

		expect(await screen.findByTestId(EDIT_TRIP.DELETING)).toHaveTextContent(
			EDIT_TRIP_CONFIG.DELETING_MESSAGE,
		)
		expect(mockDelete).toHaveBeenCalledWith({
			travellerId: 'me',
			files: traveller.files,
			fileThumbnails: traveller.fileThumbnails,
		})

		resolve('me')
		expect(await screen.findByTestId('probe')).toHaveTextContent(
			`/travellers|${EDIT_TRIP_CONFIG.DELETED_MESSAGE}`,
		)
	})

	it('shows the error dialog on a failed delete and returns focus to the button', async () => {
		// The thunk rejects with its request message, which says nothing about the profile
		mockDelete.mockRejectedValue(ERROR_MESSAGES.REQUEST_ERROR)
		renderPage()
		fireEvent.change(await screen.findByLabelText('First name'), {
			target: { value: 'Grace' },
		})
		const dialog = await openDeleteDialog()
		fireEvent.click(within(dialog).getByTestId(EDIT_TRIP.DELETE_CONFIRM))

		const error = await screen.findByTestId(EDIT_TRIP.ERROR_DIALOG)
		expect(error).toHaveTextContent(ERROR_MESSAGES.FAILED_TO_DELETE_PROFILE)
		expect(error).not.toHaveTextContent(ERROR_MESSAGES.REQUEST_ERROR)
		expect(screen.queryByTestId(EDIT_TRIP.DELETING)).not.toBeInTheDocument()
		expect(screen.getByLabelText('First name')).toHaveValue('Grace')

		fireEvent.click(within(error).getByRole('button'))
		await waitFor(() =>
			expect(
				screen.queryByTestId(EDIT_TRIP.ERROR_DIALOG),
			).not.toBeInTheDocument(),
		)
		await waitFor(() =>
			expect(screen.getByTestId(EDIT_TRIP.DELETE)).toHaveFocus(),
		)
	})
})
