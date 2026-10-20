import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import { FILE_DROP } from '@/constants/test'

import FileDrop from '@/components/forms/file-uploader/file-drop/FileDrop'

const renderDrop = (props = {}) =>
	render(
		<FileDrop
			onFilesDropped={vi.fn()}
			{...props}>
			{({ isActive }) => <span>{isActive ? 'active' : 'idle'}</span>}
		</FileDrop>,
	)

describe('<FileDrop />', () => {
	afterEach(() => {
		vi.useRealTimers()
		vi.restoreAllMocks()
	})

	it('renders node children', () => {
		render(
			<FileDrop onFilesDropped={vi.fn()}>
				<span>content</span>
			</FileDrop>,
		)
		expect(screen.getByText('content')).toBeInTheDocument()
	})

	it('becomes active on drag enter and over', () => {
		renderDrop()
		const zone = screen.getByTestId(FILE_DROP.ID)

		fireEvent.dragEnter(zone)
		expect(screen.getByText('active')).toBeInTheDocument()
		expect(zone).toHaveAttribute('data-active', 'true')

		fireEvent.dragOver(zone)
		expect(screen.getByText('active')).toBeInTheDocument()
	})

	it('becomes inactive shortly after drag leave', () => {
		vi.useFakeTimers()
		renderDrop()
		const zone = screen.getByTestId(FILE_DROP.ID)

		fireEvent.dragEnter(zone)
		fireEvent.dragLeave(zone)
		expect(screen.getByText('active')).toBeInTheDocument()

		act(() => vi.advanceTimersByTime(50))
		expect(screen.getByText('idle')).toBeInTheDocument()
	})

	it('stays active when re-entered before the delay ends', () => {
		vi.useFakeTimers()
		renderDrop()
		const zone = screen.getByTestId(FILE_DROP.ID)

		fireEvent.dragEnter(zone)
		fireEvent.dragLeave(zone)
		fireEvent.dragEnter(zone)
		act(() => vi.advanceTimersByTime(50))

		expect(screen.getByText('active')).toBeInTheDocument()
	})

	it('passes dropped files to onFilesDropped', () => {
		const onFilesDropped = vi.fn()
		renderDrop({ onFilesDropped })
		const file = new File(['x'], 'a.png', { type: 'image/png' })

		fireEvent.drop(screen.getByTestId(FILE_DROP.ID), {
			dataTransfer: { files: [file] },
		})

		expect(onFilesDropped).toHaveBeenCalledWith([file])
	})

	it('removes the body drag listeners on unmount', () => {
		const remove = vi.spyOn(document.body, 'removeEventListener')
		const { unmount } = renderDrop()

		unmount()

		;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((name) =>
			expect(remove).toHaveBeenCalledWith(name, expect.any(Function)),
		)
	})
})
