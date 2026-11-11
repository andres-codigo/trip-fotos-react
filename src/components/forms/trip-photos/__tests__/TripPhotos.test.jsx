import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TRIP_PHOTOS } from '@/constants/test'
import { TRIP_PHOTOS_CONFIG } from '@/constants/travellers'

import TripPhotos from '@/components/forms/trip-photos/TripPhotos'

const PHOTOS = [
	{ url: 'https://example.com/a.jpg', dimensions: null, thumbnails: null },
	{
		url: 'https://example.com/b.jpg',
		dimensions: { width: 800, height: 600 },
		thumbnails: [
			{ width: 640, url: 'https://example.com/b-640.jpg' },
			{ width: 320, url: 'https://example.com/b-320.jpg' },
		],
	},
	{ url: 'https://example.com/c.jpg', dimensions: null, thumbnails: null },
]

const renderPhotos = (props = {}) => {
	const handlers = { onRemove: vi.fn(), onUndo: vi.fn() }
	const allProps = { photos: PHOTOS, ...handlers, ...props }
	const view = render(<TripPhotos {...allProps} />)
	const rerender = (next) =>
		view.rerender(
			<TripPhotos
				{...allProps}
				{...next}
			/>,
		)
	return { ...handlers, rerender }
}

const removeButtons = () => screen.queryAllByTestId(TRIP_PHOTOS.REMOVE)

describe('<TripPhotos />', () => {
	it('shows only the empty hint when there are no photos', () => {
		renderPhotos({ photos: [] })

		expect(screen.getByTestId(TRIP_PHOTOS.ROOT)).toHaveTextContent(
			TRIP_PHOTOS_CONFIG.EMPTY_HINT,
		)
		expect(screen.queryByRole('list')).not.toBeInTheDocument()
		expect(screen.queryByTestId(TRIP_PHOTOS.COUNT)).not.toBeInTheDocument()
	})

	it('lists every photo as a tile in a labelled list', () => {
		renderPhotos()

		expect(
			screen.getByRole('list', { name: TRIP_PHOTOS_CONFIG.LIST_LABEL }),
		).toBeInTheDocument()
		expect(screen.getAllByTestId(TRIP_PHOTOS.TILE)).toHaveLength(3)
	})

	it('loads the smallest thumbnail with a srcset when the photo has thumbnails', () => {
		const { container } = render(
			<TripPhotos
				photos={[PHOTOS[1]]}
				onRemove={vi.fn()}
				onUndo={vi.fn()}
			/>,
		)
		const img = container.querySelector('img')

		expect(img).toHaveAttribute('src', 'https://example.com/b-320.jpg')
		expect(img).toHaveAttribute(
			'srcset',
			'https://example.com/b-320.jpg 320w, https://example.com/b-640.jpg 640w',
		)
		expect(img).toHaveAttribute('alt', '')
	})

	describe('count', () => {
		it('shows the plain count when nothing changes', () => {
			renderPhotos()

			expect(screen.getByRole('status')).toHaveTextContent(
				TRIP_PHOTOS_CONFIG.COUNT(3),
			)
		})

		it('shows the count after saving when photos are removed', () => {
			renderPhotos({ removedUrls: [PHOTOS[0].url] })

			expect(screen.getByTestId(TRIP_PHOTOS.COUNT)).toHaveTextContent(
				TRIP_PHOTOS_CONFIG.COUNT_AFTER_SAVE(2, 1, 0),
			)
		})

		it('shows the count after saving when photos are added and removed', () => {
			renderPhotos({ removedUrls: [PHOTOS[0].url], newCount: 2 })

			expect(screen.getByTestId(TRIP_PHOTOS.COUNT)).toHaveTextContent(
				TRIP_PHOTOS_CONFIG.COUNT_AFTER_SAVE(4, 1, 2),
			)
		})
	})

	it('calls onRemove with the photo url', () => {
		const { onRemove } = renderPhotos()

		fireEvent.click(
			screen.getByRole('button', {
				name: TRIP_PHOTOS_CONFIG.REMOVE_LABEL(2, 3),
			}),
		)

		expect(onRemove).toHaveBeenCalledWith(PHOTOS[1].url)
	})

	it('keeps a removed photo in place with an Undo that calls onUndo', () => {
		const { onUndo } = renderPhotos({ removedUrls: [PHOTOS[1].url] })

		expect(screen.getAllByTestId(TRIP_PHOTOS.TILE)).toHaveLength(3)
		expect(screen.getByTestId(TRIP_PHOTOS.REMOVED)).toHaveTextContent(
			TRIP_PHOTOS_CONFIG.REMOVED_LABEL,
		)
		expect(removeButtons()).toHaveLength(2)

		fireEvent.click(
			screen.getByRole('button', {
				name: TRIP_PHOTOS_CONFIG.UNDO_LABEL(2, 3),
			}),
		)

		expect(onUndo).toHaveBeenCalledWith(PHOTOS[1].url)
	})

	describe('focus', () => {
		it('does not take focus on first render', () => {
			renderPhotos({ removedUrls: [PHOTOS[0].url] })

			expect(document.body).toHaveFocus()
		})

		it('moves to Undo when a photo is removed and back to Remove when undone', () => {
			const { rerender } = renderPhotos()

			rerender({ removedUrls: [PHOTOS[1].url] })
			expect(screen.getByTestId(TRIP_PHOTOS.UNDO)).toHaveFocus()

			rerender({ removedUrls: [] })
			expect(
				screen.getByRole('button', {
					name: TRIP_PHOTOS_CONFIG.REMOVE_LABEL(2, 3),
				}),
			).toHaveFocus()
		})
	})

	describe('last photo', () => {
		const expectLastPhotoRule = () => {
			const hint = screen.getByTestId(TRIP_PHOTOS.LAST_PHOTO_HINT)
			expect(hint).toHaveTextContent(TRIP_PHOTOS_CONFIG.LAST_PHOTO_HINT)
			removeButtons().forEach((button) => {
				expect(button).toBeDisabled()
				expect(button).toHaveAttribute('aria-describedby', hint.id)
			})
		}

		it('disables removing the only photo and explains why', () => {
			renderPhotos({ photos: [PHOTOS[0]] })

			expect(removeButtons()).toHaveLength(1)
			expectLastPhotoRule()
		})

		it('disables removing the last kept photo when the other is removed', () => {
			renderPhotos({
				photos: PHOTOS.slice(0, 2),
				removedUrls: [PHOTOS[0].url],
			})

			expect(removeButtons()).toHaveLength(1)
			expectLastPhotoRule()
			expect(screen.getByTestId(TRIP_PHOTOS.UNDO)).toBeEnabled()
		})

		it('allows removing the only photo once a new one is chosen', () => {
			renderPhotos({ photos: [PHOTOS[0]], newCount: 1 })

			expect(removeButtons()[0]).toBeEnabled()
			expect(removeButtons()[0]).not.toHaveAttribute('aria-describedby')
			expect(
				screen.queryByTestId(TRIP_PHOTOS.LAST_PHOTO_HINT),
			).not.toBeInTheDocument()
		})
	})

	it('disables every Remove and Undo while disabled', () => {
		renderPhotos({ removedUrls: [PHOTOS[0].url], disabled: true })

		removeButtons().forEach((button) => expect(button).toBeDisabled())
		expect(screen.getByTestId(TRIP_PHOTOS.UNDO)).toBeDisabled()
		expect(
			screen.queryByTestId(TRIP_PHOTOS.LAST_PHOTO_HINT),
		).not.toBeInTheDocument()
	})

	it('announces an error below the photos', () => {
		renderPhotos({ error: TRIP_PHOTOS_CONFIG.NONE_LEFT_ERROR })

		const error = screen.getByTestId(TRIP_PHOTOS.ERROR)
		expect(error).toHaveAttribute('role', 'alert')
		expect(error).toHaveTextContent(TRIP_PHOTOS_CONFIG.NONE_LEFT_ERROR)
	})

	it('renders no error output without an error', () => {
		renderPhotos()

		expect(screen.queryByTestId(TRIP_PHOTOS.ERROR)).not.toBeInTheDocument()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})
})
