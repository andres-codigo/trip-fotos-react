import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseImage from '@/components/ui/image/BaseImage'

const url = 'https://example.com/ada.jpg'

const thumbnails = [
	{ width: 640, url: 'https://example.com/ada-640w.jpg' },
	{ width: 320, url: 'https://example.com/ada-320w.jpg' },
]

const renderImage = (onOpen = vi.fn(), dimensions, thumbnailList) => {
	render(
		<ul>
			<BaseImage
				title="Ada"
				url={url}
				dimensions={dimensions}
				thumbnails={thumbnailList}
				onOpen={onOpen}
			/>
		</ul>,
	)
	return onOpen
}

describe('<BaseImage />', () => {
	it('renders a lazy thumbnail with alt text', () => {
		renderImage()
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('src', url)
		expect(img).toHaveAttribute('loading', 'lazy')
	})

	it('loads the original with no srcset for a photo without thumbnails', () => {
		renderImage()
		const img = screen.getByAltText("Ada's photo")
		expect(img).not.toHaveAttribute('srcset')
		expect(img).not.toHaveAttribute('sizes')
	})

	it('serves the thumbnails as a srcset, smallest first, with the tile sizes', () => {
		renderImage(vi.fn(), undefined, thumbnails)
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('src', 'https://example.com/ada-320w.jpg')
		expect(img).toHaveAttribute(
			'srcset',
			'https://example.com/ada-320w.jpg 320w, https://example.com/ada-640w.jpg 640w',
		)
		expect(img).toHaveAttribute('sizes', GLOBAL.IMAGE_THUMBNAIL_SIZES)
	})

	// A Travellers grid card has narrower tiles than a page card, so it passes its own sizes
	it('uses the sizes it is given for the srcset', () => {
		render(
			<ul>
				<BaseImage
					title="Ada"
					url={url}
					thumbnails={thumbnails}
					sizes={GLOBAL.IMAGE_CARD_THUMBNAIL_SIZES}
				/>
			</ul>,
		)
		expect(screen.getByAltText("Ada's photo")).toHaveAttribute(
			'sizes',
			GLOBAL.IMAGE_CARD_THUMBNAIL_SIZES,
		)
	})

	it('falls back to the original when a thumbnail fails, then to the unavailable state', () => {
		renderImage(vi.fn(), undefined, thumbnails)
		fireEvent.error(screen.getByAltText("Ada's photo"))

		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('src', url)
		expect(img).not.toHaveAttribute('srcset')
		expect(screen.queryByTestId(IMAGE.FALLBACK)).not.toBeInTheDocument()

		fireEvent.error(img)
		expect(
			screen.getByRole('img', { name: "Ada's photo is unavailable" }),
		).toBeInTheDocument()
	})

	it('sets the stored dimensions so the tile reserves its space', () => {
		renderImage(vi.fn(), { width: 1600, height: 900 })
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('width', '1600')
		expect(img).toHaveAttribute('height', '900')
	})

	it('falls back to a 4:3 placeholder ratio for a legacy photo', () => {
		renderImage()
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('width', '4')
		expect(img).toHaveAttribute('height', '3')
	})

	it('calls onOpen when the thumbnail is clicked', () => {
		const onOpen = renderImage()
		fireEvent.click(
			screen.getByRole('button', { name: "View Ada's photo" }),
		)
		expect(onOpen).toHaveBeenCalledTimes(1)
	})

	it('shows a non-clickable fallback when the image fails to load', () => {
		renderImage()
		fireEvent.error(screen.getByAltText("Ada's photo"))
		expect(
			screen.getByRole('img', { name: "Ada's photo is unavailable" }),
		).toHaveTextContent(GLOBAL.IMAGE_UNAVAILABLE)
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})

	it('renders a plain image, not a button, when there is nothing to open', () => {
		render(
			<ul>
				<BaseImage
					title="Ada"
					url={url}
					thumbnails={thumbnails}
				/>
			</ul>,
		)
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute(
			'srcset',
			'https://example.com/ada-320w.jpg 320w, https://example.com/ada-640w.jpg 640w',
		)
		expect(img.closest('button')).toBeNull()
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})
})
