import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

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

	it('shows no status without one', () => {
		render(
			<FilePreview
				file={IMAGE_FILE}
				onRemove={vi.fn()}
			/>,
		)
		expect(screen.queryByRole('status')).toBeNull()
	})

	it.each(Object.values(GLOBAL.FILE_STATUS))(
		'announces the %s status',
		(status) => {
			render(
				<FilePreview
					file={{ ...IMAGE_FILE, status }}
					onRemove={vi.fn()}
				/>,
			)
			expect(screen.getByRole('status')).toHaveTextContent(
				GLOBAL.FILE_STATUS_LABEL[status],
			)
		},
	)
})
