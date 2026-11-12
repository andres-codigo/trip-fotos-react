import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import { FILE_UPLOAD } from '@/constants/validation'

import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'

import {
	IMAGE_FILE,
	NON_IMAGE_FILE,
} from '@/components/forms/file-uploader/file-preview/__tests__/filePreviewTestData'

describe('<FilePreview />', () => {
	it('renders as a list item by default with the file name', () => {
		render(
			<ul>
				<FilePreview
					file={IMAGE_FILE}
					onRemove={vi.fn()}
					onAltChange={vi.fn()}
				/>
			</ul>,
		)
		expect(screen.getByTestId(FILE_PREVIEW.ID).tagName).toBe('LI')
		expect(screen.getByTestId(FILE_PREVIEW.NAME)).toHaveTextContent(
			IMAGE_FILE.name,
		)
	})

	it('renders a custom tag', () => {
		render(
			<FilePreview
				file={IMAGE_FILE}
				onRemove={vi.fn()}
				onAltChange={vi.fn()}
				tag="div"
			/>,
		)
		expect(screen.getByTestId(FILE_PREVIEW.ID).tagName).toBe('DIV')
	})

	it('shows a thumbnail for image files', () => {
		render(
			<FilePreview
				file={IMAGE_FILE}
				onRemove={vi.fn()}
				onAltChange={vi.fn()}
			/>,
		)
		expect(screen.getByTestId(FILE_PREVIEW.THUMBNAIL)).toHaveAttribute(
			'src',
			IMAGE_FILE.url,
		)
	})

	it('omits the thumbnail for non-image files', () => {
		render(
			<FilePreview
				file={NON_IMAGE_FILE}
				onRemove={vi.fn()}
				onAltChange={vi.fn()}
			/>,
		)
		expect(screen.queryByTestId(FILE_PREVIEW.THUMBNAIL)).toBeNull()
	})

	it('calls onRemove with the file from a labelled button', () => {
		const onRemove = vi.fn()
		render(
			<FilePreview
				file={IMAGE_FILE}
				onRemove={onRemove}
			/>,
		)
		fireEvent.click(
			screen.getByRole('button', {
				name: GLOBAL.REMOVE_FILE_LABEL(IMAGE_FILE.name),
			}),
		)
		expect(onRemove).toHaveBeenCalledWith(IMAGE_FILE)
	})

	it('offers an optional description, capped at the saved length, and reports what is typed', () => {
		const onAltChange = vi.fn()
		render(
			<FilePreview
				file={{ ...IMAGE_FILE, alt: 'Old' }}
				onRemove={vi.fn()}
				onAltChange={onAltChange}
				showAltHelp
			/>,
		)
		const field = screen.getByLabelText(GLOBAL.PHOTO_ALT.LABEL)

		expect(field).toHaveValue('Old')
		expect(field).toHaveAttribute(
			'maxlength',
			String(FILE_UPLOAD.ALT_MAX_LENGTH),
		)
		expect(field).toHaveAccessibleDescription(GLOBAL.PHOTO_ALT.HELP)

		fireEvent.change(field, { target: { value: 'Charles Bridge' } })
		expect(onAltChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: IMAGE_FILE.id }),
			'Charles Bridge',
		)
	})
})
