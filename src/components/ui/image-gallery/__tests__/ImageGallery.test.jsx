import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import ImageGallery from '@/components/ui/image-gallery/ImageGallery'

vi.mock('react-dom', async () => {
	const actual = await vi.importActual('react-dom')
	return { ...actual, createPortal: (node) => node }
})

const urls = ['/a.jpg', '/b.jpg', '/c.jpg']

const Search = () => <output data-cy="search">{useLocation().search}</output>

const renderGallery = ({
	urlParam,
	initialEntry = '/',
	dimensions,
	thumbnails,
	alts,
	galleryUrls = urls,
} = {}) =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<ul>
				<ImageGallery
					title="Ada"
					urls={galleryUrls}
					dimensions={dimensions}
					thumbnails={thumbnails}
					alts={alts}
					urlParam={urlParam}
				/>
			</ul>
			<Search />
		</MemoryRouter>,
	)

const openAt = (position) =>
	fireEvent.click(
		screen.getAllByRole('button', { name: /View Ada/ })[position],
	)

const full = () => screen.getByTestId(IMAGE.FULL)

describe('<ImageGallery />', () => {
	it('uses a photo’s description as its alt text and caption, and the name and number otherwise', () => {
		renderGallery({ alts: { 1: 'Charles Bridge at sunrise' } })
		expect(
			screen.getByRole('button', {
				name: "View Ada's photo: Charles Bridge at sunrise",
			}),
		).toBeInTheDocument()

		openAt(1)
		expect(full()).toHaveAttribute('alt', 'Charles Bridge at sunrise')
		expect(screen.getByTestId(IMAGE.CAPTION)).toHaveTextContent(
			'Charles Bridge at sunrise',
		)

		fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
		expect(full()).toHaveAttribute('alt', "Ada's photo 3")
		expect(screen.queryByTestId(IMAGE.CAPTION)).not.toBeInTheDocument()
	})

	it('renders one thumbnail per url and no dialog', () => {
		renderGallery()
		expect(
			screen.getAllByRole('button', { name: /View Ada/ }),
		).toHaveLength(3)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})

	it('passes each photo its own dimensions, with a placeholder for a missing one', () => {
		renderGallery({
			dimensions: [{ width: 1600, height: 900 }, null],
		})
		const thumbnails = screen.getAllByTestId(IMAGE.THUMBNAIL)
		expect(thumbnails[0]).toHaveAttribute('width', '1600')
		expect(thumbnails[0]).toHaveAttribute('height', '900')
		expect(thumbnails[1]).toHaveAttribute('width', '4')
		expect(thumbnails[2]).toHaveAttribute('height', '3')
	})

	it('reads dimensions Firebase returned as an index-keyed object', () => {
		renderGallery({ dimensions: { 2: { width: 600, height: 800 } } })
		const thumbnails = screen.getAllByTestId(IMAGE.THUMBNAIL)
		expect(thumbnails[2]).toHaveAttribute('width', '600')
		expect(thumbnails[0]).toHaveAttribute('width', '4')
	})

	it('gives each tile its own thumbnails from an index-keyed object and keeps the full photo in the dialog', () => {
		renderGallery({
			thumbnails: { 1: [{ width: 320, url: '/b-320w.jpg' }] },
		})
		const tiles = screen.getAllByTestId(IMAGE.THUMBNAIL)
		expect(tiles[0]).toHaveAttribute('src', '/a.jpg')
		expect(tiles[0]).not.toHaveAttribute('srcset')
		expect(tiles[1]).toHaveAttribute('srcset', '/b-320w.jpg 320w')
		openAt(1)
		expect(full()).toHaveAttribute('src', '/b.jpg')
		expect(full()).not.toHaveAttribute('srcset')
	})

	it('opens the clicked photo with its position', () => {
		renderGallery()
		openAt(1)
		expect(full()).toHaveAttribute('src', '/b.jpg')
		expect(screen.getByTestId(IMAGE.COUNTER)).toHaveTextContent('2 of 3')
	})

	it('steps with the next and previous buttons', () => {
		renderGallery()
		openAt(0)
		fireEvent.click(screen.getByTestId(IMAGE.NEXT))
		expect(full()).toHaveAttribute('src', '/b.jpg')
		fireEvent.click(screen.getByTestId(IMAGE.PREVIOUS))
		expect(full()).toHaveAttribute('src', '/a.jpg')
	})

	it('disables previous on the first photo and next on the last', () => {
		renderGallery()
		openAt(0)
		expect(screen.getByTestId(IMAGE.PREVIOUS)).toBeDisabled()
		expect(screen.getByTestId(IMAGE.NEXT)).toBeEnabled()
		fireEvent.click(screen.getByTestId(IMAGE.NEXT))
		fireEvent.click(screen.getByTestId(IMAGE.NEXT))
		expect(screen.getByTestId(IMAGE.NEXT)).toBeDisabled()
	})

	it('steps with the arrow keys and stops at the ends', () => {
		renderGallery()
		openAt(0)
		fireEvent.keyDown(window, { key: 'ArrowLeft' })
		expect(full()).toHaveAttribute('src', '/a.jpg')
		fireEvent.keyDown(window, { key: 'ArrowRight' })
		fireEvent.keyDown(window, { key: 'ArrowRight' })
		fireEvent.keyDown(window, { key: 'ArrowRight' })
		expect(full()).toHaveAttribute('src', '/c.jpg')
		fireEvent.keyDown(window, { key: 'ArrowLeft' })
		expect(full()).toHaveAttribute('src', '/b.jpg')
	})

	it('closes the dialog when Escape is pressed', async () => {
		renderGallery()
		openAt(0)
		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
		await waitFor(() =>
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
		)
	})

	it('closes the dialog when Close is clicked', async () => {
		renderGallery()
		openAt(0)
		fireEvent.click(screen.getByRole('button', { name: /close/i }))
		await waitFor(() =>
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
		)
	})

	it('shows the fallback when the full image fails', () => {
		renderGallery()
		openAt(0)
		fireEvent.error(full())
		expect(screen.getByRole('dialog')).toHaveTextContent(
			GLOBAL.IMAGE_UNAVAILABLE,
		)
	})

	it('loads only the open photo and its neighbours', () => {
		renderGallery()
		openAt(0)
		const sources = [
			...screen.getByRole('dialog').querySelectorAll('img'),
		].map((img) => img.getAttribute('src'))
		expect(sources).toEqual(['/a.jpg', '/b.jpg'])
	})

	it('shows the tile’s thumbnail until the full photo loads', () => {
		renderGallery({
			thumbnails: { 0: [{ width: 320, url: '/a-320w.jpg' }] },
		})
		openAt(0)
		const dialog = screen.getByRole('dialog')
		expect(dialog.querySelector('img[src="/a-320w.jpg"]')).not.toBeNull()
		fireEvent.load(full())
		expect(dialog.querySelector('img[src="/a-320w.jpg"]')).toBeNull()
	})

	it('holds a legacy photo’s place with a block in its shape', () => {
		renderGallery({ dimensions: [{ width: 900, height: 1200 }] })
		openAt(0)
		expect(
			screen
				.getByRole('dialog')
				.querySelector('svg[viewBox="0 0 900 1200"]'),
		).not.toBeNull()
	})

	it('names a slow photo as loading, and only once it is slow', () => {
		vi.useFakeTimers()
		try {
			renderGallery()
			openAt(0)
			expect(
				screen.queryByText(GLOBAL.SPINNER_LABEL.PHOTO),
			).not.toBeInTheDocument()
			act(() => vi.advanceTimersByTime(400))
			expect(
				screen.getByText(GLOBAL.SPINNER_LABEL.PHOTO),
			).toBeInTheDocument()
			fireEvent.load(full())
			expect(
				screen.queryByText(GLOBAL.SPINNER_LABEL.PHOTO),
			).not.toBeInTheDocument()
		} finally {
			vi.useRealTimers()
		}
	})

	it('shows no arrows or counter for a single photo', () => {
		renderGallery({ galleryUrls: ['/a.jpg'] })
		openAt(0)
		expect(full()).toHaveAttribute('src', '/a.jpg')
		expect(screen.queryByTestId(IMAGE.PREVIOUS)).not.toBeInTheDocument()
		expect(screen.queryByTestId(IMAGE.NEXT)).not.toBeInTheDocument()
		expect(screen.queryByTestId(IMAGE.COUNTER)).not.toBeInTheDocument()
	})

	it('returns focus to the tile that opened it', async () => {
		renderGallery()
		const tile = screen.getAllByRole('button', { name: /View Ada/ })[1]
		tile.focus()
		fireEvent.click(tile)
		fireEvent.click(screen.getByRole('button', { name: 'Close' }))
		await waitFor(() => expect(tile).toHaveFocus())
	})

	describe('with a urlParam', () => {
		it('opens the photo a swipe settles on', () => {
			vi.useFakeTimers()
			try {
				renderGallery({ urlParam: 'photo' })
				openAt(0)
				const track = screen.getByTestId(IMAGE.TRACK)
				Object.defineProperty(track, 'clientWidth', { value: 390 })
				track.scrollLeft = 780
				fireEvent.scroll(track)
				expect(screen.getByTestId('search')).toHaveTextContent(
					'?photo=1',
				)
				act(() => vi.advanceTimersByTime(120))
				expect(screen.getByTestId('search')).toHaveTextContent(
					'?photo=3',
				)
				expect(full()).toHaveAttribute('src', '/c.jpg')
			} finally {
				vi.useRealTimers()
			}
		})

		it('writes the 1-based photo number to the URL as it opens and steps', () => {
			renderGallery({ urlParam: 'photo' })
			expect(screen.getByTestId('search')).toHaveTextContent('')
			openAt(0)
			expect(screen.getByTestId('search')).toHaveTextContent('?photo=1')
			fireEvent.click(screen.getByTestId(IMAGE.NEXT))
			expect(screen.getByTestId('search')).toHaveTextContent('?photo=2')
		})

		it('opens the photo named in the URL', () => {
			renderGallery({ urlParam: 'photo', initialEntry: '/?photo=3' })
			expect(full()).toHaveAttribute('src', '/c.jpg')
		})

		it.each(['0', '4', 'abc', ''])(
			'ignores an invalid photo of %j',
			(value) => {
				renderGallery({
					urlParam: 'photo',
					initialEntry: `/?photo=${value}`,
				})
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			},
		)

		it('removes the param, keeping other params, when closed', async () => {
			renderGallery({ urlParam: 'photo', initialEntry: '/?a=1&photo=2' })
			fireEvent.click(screen.getByRole('button', { name: /close/i }))
			await waitFor(() =>
				expect(screen.getByTestId('search')).toHaveTextContent('?a=1'),
			)
			expect(screen.getByTestId('search')).not.toHaveTextContent('photo')
		})
	})
})
