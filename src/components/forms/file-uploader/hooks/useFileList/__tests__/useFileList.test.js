import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { FILE_UPLOAD, VALIDATION_MESSAGES } from '@/constants/validation'

import useFileList from '@/components/forms/file-uploader/hooks/useFileList'

import {
	createFile,
	OVERSIZED_BYTES,
} from '@/components/forms/file-uploader/hooks/useFileList/__tests__/fileListTestData'

describe('useFileList', () => {
	let urlCount

	beforeEach(() => {
		urlCount = 0
		vi.spyOn(URL, 'createObjectURL').mockImplementation(
			() => `blob:mock-${++urlCount}`,
		)
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('starts with no files and no errors', () => {
		const { result } = renderHook(() => useFileList())
		expect(result.current.files).toEqual([])
		expect(result.current.errors).toEqual([])
	})

	it('adds files with an id, metadata and preview URL', () => {
		const { result } = renderHook(() => useFileList())
		const file = createFile()

		act(() => result.current.addFiles([file]))

		expect(result.current.files).toHaveLength(1)
		expect(result.current.files[0]).toMatchObject({
			file,
			name: 'photo.jpg',
			type: 'image/jpeg',
			size: 1024,
			url: 'blob:mock-1',
		})
		expect(result.current.files[0].id).toContain('photo.jpg')
	})

	it('accepts a FileList-like iterable and ignores empty input', () => {
		const { result } = renderHook(() => useFileList())

		act(() => result.current.addFiles(null))
		act(() => result.current.addFiles([]))

		expect(result.current.files).toEqual([])
	})

	it('ignores duplicates within and across calls', () => {
		const { result } = renderHook(() => useFileList())
		const file = createFile()

		act(() => result.current.addFiles([file, createFile()]))
		act(() => result.current.addFiles([createFile()]))

		expect(result.current.files).toHaveLength(1)
		expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
	})

	it('rejects unsupported types with an error', () => {
		const { result } = renderHook(() => useFileList())

		act(() =>
			result.current.addFiles([
				createFile({ name: 'notes.pdf', type: 'application/pdf' }),
			]),
		)

		expect(result.current.files).toEqual([])
		expect(result.current.errors).toEqual([
			VALIDATION_MESSAGES.FILE_TYPE_INVALID('notes.pdf'),
		])
	})

	it('rejects files over the size limit with an error', () => {
		const { result } = renderHook(() => useFileList())

		act(() =>
			result.current.addFiles([
				createFile({
					name: 'big.png',
					type: 'image/png',
					size: OVERSIZED_BYTES,
				}),
			]),
		)

		expect(result.current.files).toEqual([])
		expect(result.current.errors).toEqual([
			VALIDATION_MESSAGES.FILE_TOO_LARGE(
				'big.png',
				FILE_UPLOAD.MAX_SIZE_MEGABYTES,
			),
		])
	})

	it('keeps valid files when some in the batch are invalid', () => {
		const { result } = renderHook(() => useFileList())

		act(() =>
			result.current.addFiles([
				createFile({ name: 'ok.webp', type: 'image/webp' }),
				createFile({ name: 'bad.txt', type: 'text/plain' }),
			]),
		)

		expect(result.current.files.map(({ name }) => name)).toEqual([
			'ok.webp',
		])
		expect(result.current.errors).toHaveLength(1)
	})

	it('clears previous errors on the next add', () => {
		const { result } = renderHook(() => useFileList())

		act(() => result.current.addFiles([createFile({ type: 'text/plain' })]))
		act(() => result.current.addFiles([createFile()]))

		expect(result.current.errors).toEqual([])
	})

	it('removes a file and revokes its preview URL', () => {
		const { result } = renderHook(() => useFileList())

		act(() =>
			result.current.addFiles([
				createFile({ name: 'a.jpg' }),
				createFile({ name: 'b.jpg' }),
			]),
		)
		const [first] = result.current.files

		act(() => result.current.removeFile(first))

		expect(result.current.files.map(({ name }) => name)).toEqual(['b.jpg'])
		expect(URL.revokeObjectURL).toHaveBeenCalledWith(first.url)
	})

	it('ignores removing a file that is not in the list', () => {
		const { result } = renderHook(() => useFileList())

		act(() => result.current.addFiles([createFile()]))
		act(() => result.current.removeFile({ id: 'missing' }))

		expect(result.current.files).toHaveLength(1)
		expect(URL.revokeObjectURL).not.toHaveBeenCalled()
	})

	it('clears all files and errors', () => {
		const { result } = renderHook(() => useFileList())

		act(() => result.current.addFiles([createFile()]))
		act(() => result.current.clearFiles())

		expect(result.current.files).toEqual([])
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')
	})

	it('revokes remaining preview URLs on unmount', () => {
		const { result, unmount } = renderHook(() => useFileList())

		act(() => result.current.addFiles([createFile()]))
		unmount()

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')
	})

	it('keeps action references stable between renders', () => {
		const { result, rerender } = renderHook(() => useFileList())
		const { addFiles, removeFile, clearFiles } = result.current

		rerender()

		expect(result.current.addFiles).toBe(addFiles)
		expect(result.current.removeFile).toBe(removeFile)
		expect(result.current.clearFiles).toBe(clearFiles)
	})
})
