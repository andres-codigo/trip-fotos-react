import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

import { FILE_DROP, FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import { VALIDATION_MESSAGES } from '@/constants/validation'

import AddFile from '@/components/forms/file-uploader/AddFile'

import { createFile } from '@/components/forms/file-uploader/__tests__/addFileTestData'

const selectFiles = (files) =>
	fireEvent.change(screen.getByTestId(FILE_DROP.INPUT), {
		target: { files },
	})

describe('<AddFile />', () => {
	beforeEach(() => {
		let count = 0
		vi.spyOn(URL, 'createObjectURL').mockImplementation(
			() => `blob:mock-${++count}`,
		)
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders the idle prompt and an accessible file input', () => {
		render(<AddFile />)
		expect(screen.getByText(GLOBAL.FILE_DROP_TEXT.IDLE)).toBeInTheDocument()
		const input = screen.getByTestId(FILE_DROP.INPUT)
		expect(input).toHaveAttribute('type', 'file')
		expect(input).toHaveAttribute('multiple')
		expect(screen.getByLabelText(/Drag and drop/)).toBe(input)
	})

	it('shows previews for selected files and no list when empty', () => {
		render(<AddFile />)
		expect(screen.queryByTestId(FILE_DROP.LIST)).toBeNull()

		selectFiles([
			createFile({ name: 'a.png' }),
			createFile({ name: 'b.png' }),
		])

		const list = screen.getByRole('list', { name: GLOBAL.FILE_LIST_LABEL })
		expect(within(list).getAllByTestId(FILE_PREVIEW.ID)).toHaveLength(2)
	})

	it('ignores duplicates and resets the input value', () => {
		render(<AddFile />)
		const file = createFile()

		selectFiles([file])
		selectFiles([file])

		expect(screen.getAllByTestId(FILE_PREVIEW.ID)).toHaveLength(1)
		expect(screen.getByTestId(FILE_DROP.INPUT).value).toBe('')
	})

	it('adds dropped files', () => {
		render(<AddFile />)

		fireEvent.drop(screen.getByTestId(FILE_DROP.ID), {
			dataTransfer: { files: [createFile()] },
		})

		expect(screen.getAllByTestId(FILE_PREVIEW.ID)).toHaveLength(1)
	})

	it('announces validation errors and links them to the input', () => {
		render(<AddFile id="photos" />)

		selectFiles([
			createFile({ name: 'notes.pdf', type: 'application/pdf' }),
		])

		const alert = screen.getByRole('alert')
		expect(alert).toHaveTextContent(
			VALIDATION_MESSAGES.FILE_TYPE_INVALID('notes.pdf'),
		)
		const input = screen.getByTestId(FILE_DROP.INPUT)
		expect(input).toHaveAttribute('aria-invalid', 'true')
		expect(input).toHaveAttribute('aria-describedby', 'photos-error')
		expect(alert).toHaveAttribute('id', 'photos-error')
	})

	it('removes a file via its preview', () => {
		render(<AddFile />)
		selectFiles([createFile({ name: 'a.png' })])

		fireEvent.click(
			screen.getByRole('button', {
				name: GLOBAL.REMOVE_FILE_LABEL('a.png'),
			}),
		)

		expect(screen.queryByTestId(FILE_PREVIEW.ID)).toBeNull()
	})

	it('exposes the file list to the parent via onFilesUpdated', () => {
		const onFilesUpdated = vi.fn()
		render(<AddFile onFilesUpdated={onFilesUpdated} />)
		expect(onFilesUpdated).not.toHaveBeenCalled()

		const file = createFile()
		selectFiles([file])
		expect(onFilesUpdated).toHaveBeenLastCalledWith([
			expect.objectContaining({ file, name: file.name }),
		])

		fireEvent.click(
			screen.getByRole('button', {
				name: GLOBAL.REMOVE_FILE_LABEL(file.name),
			}),
		)
		expect(onFilesUpdated).toHaveBeenLastCalledWith([])
	})
})
