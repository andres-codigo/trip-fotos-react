import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

const renderGallery = ({ urlParam, initialEntry = '/', dimensions } = {}) =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<ul>
				<ImageGallery
					title="Ada"
					urls={urls}
					dimensions={dimensions}
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

	describe('with a urlParam', () => {
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
