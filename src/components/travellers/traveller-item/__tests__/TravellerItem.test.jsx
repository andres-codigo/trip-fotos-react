import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useDispatch, useSelector } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'
import { BADGE, IMAGE, TRAVELLER_ITEM } from '@/constants/test'

vi.mock('react-redux', async () => {
	const { createReactReduxMock } =
		await import('@/testUtils/vitest/mockReactRedux')
	return createReactReduxMock()
})

vi.mock('@/store/slices/authenticationSlice', () => ({
	selectUserId: 'selectUserId',
	selectIsAdmin: 'selectIsAdmin',
}))

vi.mock('@/store/slices/travellersSlice', () => {
	const deleteTraveller = vi.fn((arg) => ({ type: 'delete', arg }))
	deleteTraveller.rejected = { match: (result) => result?.rejected === true }
	return { deleteTraveller, selectIsTraveller: 'selectIsTraveller' }
})

import TravellerItem from '@/components/travellers/traveller-item/TravellerItem'
import { deleteTraveller } from '@/store/slices/travellersSlice'

const baseProps = {
	id: 'abc',
	firstName: 'Ada',
	lastName: 'Lovelace',
	tripDescription: 'Loves analytical engines',
	tripStart: '2024-03-05',
	tripEnd: '2024-03-11',
	cities: [
		'tokyo',
		{ id: 'p1', city: 'Paris', region: 'IDF', country: 'France' },
	],
	files: [],
	registered: '2024-03-05T10:00:00.000Z',
}

const setup = ({
	userId = 'me',
	isAdmin = false,
	isTraveller = false,
} = {}) => {
	const values = {
		selectUserId: userId,
		selectIsAdmin: isAdmin,
		selectIsTraveller: isTraveller,
	}
	vi.mocked(useSelector).mockImplementation((selector) => values[selector])
}

const renderItem = (props = {}) =>
	render(
		<MemoryRouter>
			<ul>
				<TravellerItem
					{...baseProps}
					{...props}
				/>
			</ul>
		</MemoryRouter>,
	)

const files = (n) => Array.from({ length: n }, (_, i) => `https://img/${i}.jpg`)

describe('<TravellerItem />', () => {
	let dispatch

	beforeEach(() => {
		vi.clearAllMocks()
		dispatch = vi.fn().mockResolvedValue({})
		vi.mocked(useDispatch).mockReturnValue(dispatch)
		setup()
	})

	describe('Rendering', () => {
		it('renders name, trip dates and length, and trip description', () => {
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.NAME)).toHaveTextContent(
				'Ada Lovelace',
			)
			expect(screen.getByTestId(TRAVELLER_ITEM.TRIP)).toHaveTextContent(
				'5–11 Mar 2024',
			)
			expect(screen.getByTestId(TRAVELLER_ITEM.TRIP)).toHaveTextContent(
				'7 days',
			)
			expect(
				screen.getByTestId(TRAVELLER_ITEM.TRIP_DESCRIPTION),
			).toHaveTextContent('Loves analytical engines')
		})

		it('does not show the registration date', () => {
			renderItem({ registered: '2024-04-02T10:00:00.000Z' })
			expect(screen.queryByText(/2 Apr|02 Apr/)).not.toBeInTheDocument()
		})

		it('shows only the length for an older traveller with no trip dates', () => {
			renderItem({
				tripStart: undefined,
				tripEnd: undefined,
				daysInCity: 8,
			})
			expect(screen.getByTestId(TRAVELLER_ITEM.TRIP)).toHaveTextContent(
				'Trip: 8 days',
			)
		})

		it('shows no trip line when nothing about the trip is stored', () => {
			renderItem({ tripStart: undefined, tripEnd: undefined })
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.TRIP),
			).not.toBeInTheDocument()
		})

		it('highlights the signed-in user record', () => {
			setup({ userId: 'abc' })
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.ROOT)).toHaveAttribute(
				'data-own',
				'true',
			)
		})

		it('does not highlight other records', () => {
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.ROOT)).toHaveAttribute(
				'data-own',
				'false',
			)
		})
	})

	describe('Trip description truncation', () => {
		it.each([
			[249, false],
			[250, true],
			[300, true],
		])('handles %i characters (truncated: %s)', (length, truncated) => {
			const tripDescription = 'a'.repeat(length)
			renderItem({ tripDescription })
			const text = screen.getByTestId(
				TRAVELLER_ITEM.TRIP_DESCRIPTION,
			).textContent
			expect(text).toBe(
				truncated ? `${'a'.repeat(250)}...` : tripDescription,
			)
		})
	})

	describe('Badges', () => {
		it('gives legacy and object cities a badge tone', () => {
			renderItem()
			const badges = screen.getAllByTestId(BADGE.ID)
			expect(badges).toHaveLength(2)
			expect(badges[0]).toHaveTextContent('Tokyo, Japan')
			expect(badges[0].className).toMatch(/\bbg-badge-\d\b/)
			expect(badges[1]).toHaveTextContent('Paris, France')
			expect(badges[1].className).toMatch(/\bbg-badge-\d\b/)
		})
	})

	describe('Images', () => {
		it('renders no list without files', () => {
			renderItem()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.IMAGES_LIST),
			).not.toBeInTheDocument()
		})

		it('shows all images and no link for 5 files', () => {
			renderItem({ files: files(5) })
			expect(screen.getAllByTestId(IMAGE.ID)).toHaveLength(5)
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.SEE_ALL_LINK),
			).not.toBeInTheDocument()
		})

		it('serves each tile its stored thumbnails', () => {
			renderItem({
				files: files(2),
				fileThumbnails: [[{ width: 320, url: '/0-320w.jpg' }]],
			})
			const tiles = screen.getAllByTestId(IMAGE.THUMBNAIL)
			expect(tiles[0]).toHaveAttribute('srcset', '/0-320w.jpg 320w')
			expect(tiles[1]).not.toHaveAttribute('srcset')
		})

		it('caps at 5 images and shows the see-all link for 7 files', () => {
			renderItem({ files: files(7) })
			expect(screen.getAllByTestId(IMAGE.ID)).toHaveLength(5)
			const link = screen.getByTestId(TRAVELLER_ITEM.SEE_ALL_LINK)
			expect(link).toHaveTextContent('See all 7 photos')
			expect(link).toHaveAttribute('href', '/travellers/abc#photos')
		})
	})

	describe('Actions', () => {
		it('always shows the details link', () => {
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.DETAILS)).toHaveAttribute(
				'href',
				'/travellers/abc',
			)
		})

		it('shows contact for another traveller when registered', () => {
			setup({ isTraveller: true })
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.CONTACT)).toHaveAttribute(
				'href',
				'/travellers/abc/contact',
			)
		})

		it('hides contact when not a traveller', () => {
			renderItem()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.CONTACT),
			).not.toBeInTheDocument()
		})

		it('hides contact and delete on own record', () => {
			setup({ userId: 'abc', isTraveller: true, isAdmin: true })
			renderItem()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.CONTACT),
			).not.toBeInTheDocument()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.DELETE),
			).not.toBeInTheDocument()
		})

		it('offers Edit trip, before Details, on own record only', () => {
			setup({ userId: 'abc', isTraveller: true })
			renderItem()
			const edit = screen.getByTestId(TRAVELLER_ITEM.EDIT)
			expect(edit).toHaveAttribute('href', '/travellers/abc/edit')
			expect(edit).toHaveTextContent(TRAVELLER_ITEM_CONFIG.EDIT_LABEL)
			expect(
				edit.compareDocumentPosition(
					screen.getByTestId(TRAVELLER_ITEM.DETAILS),
				) & Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy()
		})

		it("does not offer Edit trip on someone else's record, even to an admin", () => {
			setup({ isTraveller: true, isAdmin: true })
			renderItem()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.EDIT),
			).not.toBeInTheDocument()
		})

		it('hides delete for non-admins', () => {
			renderItem()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.DELETE),
			).not.toBeInTheDocument()
		})
	})

	describe('Delete', () => {
		beforeEach(() => setup({ isAdmin: true }))

		const confirmDelete = () => {
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE))
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE_CONFIRM))
		}

		it('asks for confirmation naming the traveller before deleting', () => {
			renderItem()
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE))
			const dialog = screen.getByTestId(TRAVELLER_ITEM.DELETE_DIALOG)
			expect(dialog).toHaveTextContent(
				TRAVELLER_ITEM_CONFIG.DELETE_DIALOG_TITLE,
			)
			expect(dialog).toHaveTextContent(
				"Ada Lovelace's profile, photos and messages",
			)
			expect(dispatch).not.toHaveBeenCalled()
		})

		it('focuses cancel when the confirmation opens', () => {
			renderItem()
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE))
			expect(
				screen.getByTestId(TRAVELLER_ITEM.DELETE_CANCEL),
			).toHaveFocus()
		})

		it('cancels without deleting and returns focus to the delete button', async () => {
			renderItem()
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE))
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE_CANCEL))
			await waitFor(() =>
				expect(
					screen.queryByTestId(TRAVELLER_ITEM.DELETE_DIALOG),
				).not.toBeInTheDocument(),
			)
			expect(dispatch).not.toHaveBeenCalled()
			expect(screen.getByTestId(TRAVELLER_ITEM.DELETE)).toHaveFocus()
		})

		it('cancels on Escape', async () => {
			renderItem()
			fireEvent.click(screen.getByTestId(TRAVELLER_ITEM.DELETE))
			fireEvent.keyDown(
				screen.getByTestId(TRAVELLER_ITEM.DELETE_DIALOG),
				{
					key: 'Escape',
				},
			)
			await waitFor(() =>
				expect(
					screen.queryByTestId(TRAVELLER_ITEM.DELETE_DIALOG),
				).not.toBeInTheDocument(),
			)
			expect(dispatch).not.toHaveBeenCalled()
			expect(screen.getByTestId(TRAVELLER_ITEM.DELETE)).toHaveFocus()
		})

		it('dispatches deleteTraveller with id, files and thumbnails on confirm', async () => {
			const urls = files(2)
			const fileThumbnails = [[{ width: 320, url: '/0-320w.jpg' }]]
			renderItem({ files: urls, fileThumbnails })
			confirmDelete()
			await waitFor(() => expect(dispatch).toHaveBeenCalled())
			expect(deleteTraveller).toHaveBeenCalledWith({
				travellerId: 'abc',
				files: urls,
				fileThumbnails,
			})
		})

		it('shows a spinner while pending', async () => {
			dispatch.mockReturnValue(new Promise(() => {}))
			renderItem()
			confirmDelete()
			expect(
				await screen.findByTestId(TRAVELLER_ITEM.SPINNER),
			).toBeInTheDocument()
			expect(
				screen.queryByTestId(TRAVELLER_ITEM.ROOT),
			).not.toBeInTheDocument()
		})

		it('shows the payload in a dialog on failure and clears it on close', async () => {
			dispatch.mockResolvedValue({ rejected: true, payload: 'Nope' })
			renderItem()
			confirmDelete()
			const dialog = await screen.findByTestId(
				TRAVELLER_ITEM.ERROR_DIALOG,
			)
			expect(dialog).toHaveTextContent('Nope')
			expect(dialog).toHaveTextContent(GLOBAL.ERROR_DIALOG_TITLE)
			expect(screen.getByTestId(TRAVELLER_ITEM.ROOT)).toBeInTheDocument()

			fireEvent.click(screen.getByRole('button', { name: /close/i }))
			await waitFor(() =>
				expect(
					screen.queryByTestId(TRAVELLER_ITEM.ERROR_DIALOG),
				).not.toBeInTheDocument(),
			)
		})

		it('falls back to the generic message without a payload', async () => {
			dispatch.mockResolvedValue({ rejected: true })
			renderItem()
			confirmDelete()
			expect(
				await screen.findByText(ERROR_MESSAGES.SOMETHING_WENT_WRONG),
			).toBeInTheDocument()
		})
	})
})
