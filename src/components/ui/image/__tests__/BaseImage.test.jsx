import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { GLOBAL } from '@/constants/ui'

import BaseImage from '@/components/ui/image/BaseImage'

vi.mock('@/components/ui/image/BaseImage.module.scss', () => ({
	default: { 'image-preview': 'image-preview' },
}))

const url = 'https://example.com/ada.jpg'

const renderImage = (onOpen = vi.fn()) => {
	render(
		<ul>
			<BaseImage
				title="Ada"
				url={url}
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
})
