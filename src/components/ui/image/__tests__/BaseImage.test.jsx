import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { DIALOG, IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseImage from '@/components/ui/image/BaseImage'

vi.mock('@/components/ui/image/BaseImage.module.scss', () => ({
	default: {
		'image-preview': 'image-preview',
		landscape: 'landscape',
		portrait: 'portrait',
		square: 'square',
	},
}))

vi.mock('react-dom', async () => {
	const actual = await vi.importActual('react-dom')
	return { ...actual, createPortal: (node) => node }
})

const props = { title: 'Ada', url: 'https://example.com/ada.jpg' }

const openDialog = () =>
	fireEvent.click(screen.getByRole('button', { name: "View Ada's photo" }))

describe('<BaseImage />', () => {
	it('renders a lazy thumbnail with alt text', () => {
		render(<BaseImage {...props} />)
		const img = screen.getByAltText("Ada's photo")
		expect(img).toHaveAttribute('src', props.url)
		expect(img).toHaveAttribute('loading', 'lazy')
	})

	it('opens the dialog with a title on click', () => {
		render(<BaseImage {...props} />)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		openDialog()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getByTestId(DIALOG.TITLE)).toHaveTextContent(
			"Ada's photos",
		)
	})

	it('closes the dialog when Close is clicked', async () => {
		render(<BaseImage {...props} />)
		openDialog()
		fireEvent.click(screen.getByRole('button', { name: /close/i }))
		await waitFor(() =>
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
		)
	})

	it.each([
		[200, 100, 'landscape'],
		[100, 200, 'portrait'],
		[100, 100, 'square'],
	])('sets orientation for %ix%i as %s', (w, h, expected) => {
		render(<BaseImage {...props} />)
		openDialog()
		const full = screen.getByTestId(IMAGE.FULL)
		Object.defineProperty(full, 'naturalWidth', { value: w })
		Object.defineProperty(full, 'naturalHeight', { value: h })
		fireEvent.load(full)
		expect(full).toHaveClass(expected)
	})

	it('shows the fallback when the image fails to load', () => {
		render(<BaseImage {...props} />)
		fireEvent.error(screen.getByAltText("Ada's photo"))
		expect(
			screen.queryByRole('img', { name: "Ada's photo" }),
		).toHaveTextContent(GLOBAL.IMAGE_UNAVAILABLE)
		openDialog()
		expect(screen.getAllByText(GLOBAL.IMAGE_UNAVAILABLE)).toHaveLength(2)
	})
})
