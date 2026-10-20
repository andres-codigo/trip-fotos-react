import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useDispatch, useSelector } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ERROR_MESSAGES } from '@/constants/errors'
import { TRAVELLER_ITEM_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'
import { BADGE, IMAGE, TRAVELLER_ITEM } from '@/constants/test'

vi.mock('react-redux', async () => {
	const actual = await vi.importActual('react-redux')
	return { ...actual, useDispatch: vi.fn(), useSelector: vi.fn() }
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
	description: 'Loves analytical engines',
	daysInCity: 7,
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
		it('renders name, date, description and days', () => {
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.NAME)).toHaveTextContent(
				'Ada Lovelace',
			)
			expect(
				screen.getByTestId(TRAVELLER_ITEM.REGISTERED),
			).toHaveTextContent('05 Mar 2024')
			expect(
				screen.getByTestId(TRAVELLER_ITEM.DESCRIPTION),
			).toHaveTextContent('Loves analytical engines')
			expect(screen.getByTestId(TRAVELLER_ITEM.DAYS)).toHaveTextContent(
				'Days in city: 7 days',
			)
		})

		it('renders an empty date when registered is missing', () => {
			renderItem({ registered: undefined })
			expect(
				screen.getByTestId(TRAVELLER_ITEM.REGISTERED),
			).toBeEmptyDOMElement()
		})

		it('highlights the signed-in user record', () => {
			setup({ userId: 'abc' })
			renderItem()
			expect(screen.getByTestId(TRAVELLER_ITEM.ROOT).className).toMatch(
				/own/,
			)
		})

		it('does not highlight other records', () => {
			renderItem()
			expect(
				screen.getByTestId(TRAVELLER_ITEM.ROOT).className,
			).not.toMatch(/own/)
		})
	})

	describe('Description truncation', () => {
		it.each([
			[249, false],
			[250, true],
			[300, true],
		])('handles %i characters (truncated: %s)', (length, truncated) => {
			const description = 'a'.repeat(length)
			renderItem({ description })
			const text = screen.getByTestId(
				TRAVELLER_ITEM.DESCRIPTION,
			).textContent
			expect(text).toBe(truncated ? `${'a'.repeat(250)}...` : description)
		})
	})

	describe('Badges', () => {
		it('renders legacy and object cities with type class only for legacy', () => {
			renderItem()
			const badges = screen.getAllByTestId(BADGE.ID)
			expect(badges).toHaveLength(2)
			expect(badges[0]).toHaveTextContent('Tokyo, Japan')
			expect(badges[0].className).toMatch(/tokyo/)
			expect(badges[1]).toHaveTextContent('Paris, France')
			expect(badges[1].className).not.toMatch(
				/tokyo|prague|sydney|canberra/,
			)
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

		it('caps at 5 images and shows the see-all link for 7 files', () => {
			renderItem({ files: files(7) })
			expect(screen.getAllByTestId(IMAGE.ID)).toHaveLength(5)
			const link = screen.getByTestId(TRAVELLER_ITEM.SEE_ALL_LINK)
			expect(link).toHaveTextContent('See all 7 photos')
			expect(link).toHaveAttribute('href', '/travellers/abc')
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
			fireEvent.keyDown(window, { key: 'Escape' })
			await waitFor(() =>
				expect(
					screen.queryByTestId(TRAVELLER_ITEM.DELETE_DIALOG),
				).not.toBeInTheDocument(),
			)
			expect(dispatch).not.toHaveBeenCalled()
			expect(screen.getByTestId(TRAVELLER_ITEM.DELETE)).toHaveFocus()
		})

		it('dispatches deleteTraveller with id and files on confirm', async () => {
			const urls = files(2)
			renderItem({ files: urls })
			confirmDelete()
			await waitFor(() => expect(dispatch).toHaveBeenCalled())
			expect(deleteTraveller).toHaveBeenCalledWith({
				travellerId: 'abc',
				files: urls,
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
