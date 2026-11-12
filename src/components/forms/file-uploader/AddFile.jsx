import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { FILE_UPLOAD } from '@/constants/validation'
import { FILE_DROP, FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import FileDrop from '@/components/forms/file-uploader/file-drop/FileDrop'
import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'
import useFileList from '@/components/forms/file-uploader/hooks/useFileList'

import { cn } from '@/utils/cn'

const { FILE_DROP_TEXT } = GLOBAL

const AddFile = ({
	id = 'file-input',
	onFilesUpdated,
	isInvalid = false,
	describedBy,
}) => {
	const { files, errors, addFiles, removeFile, setAlt } = useFileList()
	const errorId = `${id}-error`
	const listRef = useRef(null)
	const inputRef = useRef(null)
	const focusAfterRemove = useRef(null)

	const onFilesUpdatedRef = useRef(onFilesUpdated)
	useEffect(() => {
		onFilesUpdatedRef.current = onFilesUpdated
	}, [onFilesUpdated])

	const isFirstRender = useRef(true)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}
		onFilesUpdatedRef.current?.(files)
	}, [files])

	// The pressed button goes with its row, so focus moves to the next row's, or the uploader when none is left
	useEffect(() => {
		const index = focusAfterRemove.current
		if (index === null) return
		focusAfterRemove.current = null

		const rows = listRef.current?.children ?? []
		const row = rows[Math.min(index, rows.length - 1)]
		const target = row?.querySelector(
			`[data-cy="${FILE_PREVIEW.REMOVE_BUTTON}"]`,
		)
		;(target ?? inputRef.current)?.focus()
	}, [files])

	const handleRemove = (file) => {
		focusAfterRemove.current = files.findIndex(
			({ id: fileId }) => fileId === file.id,
		)
		removeFile(file)
	}

	const handleAltChange = (file, alt) => setAlt(file.id, alt)

	const handleInputChange = (event) => {
		addFiles(event.target.files)
		// Reset so choosing the same file again still fires change
		event.target.value = ''
	}

	return (
		<div className="mx-auto flex flex-col gap-4 text-center">
			<FileDrop
				onFilesDropped={addFiles}
				className={cn(
					isInvalid &&
						'border-2 border-danger-text bg-danger-surface',
				)}>
				{({ isActive }) => (
					<>
						<label
							htmlFor={id}
							className="relative mb-2 block cursor-pointer p-12 font-semibold focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-focus [&>span]:block">
							{isActive ? (
								<>
									<span>{FILE_DROP_TEXT.ACTIVE}</span>
									<span>{FILE_DROP_TEXT.ACTIVE_HINT}</span>
								</>
							) : (
								<>
									<span>{FILE_DROP_TEXT.IDLE}</span>
									<span>
										{FILE_DROP_TEXT.IDLE_HINT_PREFIX}{' '}
										<span className="text-accent-text underline underline-offset-4">
											{FILE_DROP_TEXT.IDLE_HINT_ACTION}
										</span>
									</span>
								</>
							)}
							<input
								ref={inputRef}
								id={id}
								type="file"
								multiple
								accept={FILE_UPLOAD.ACCEPTED_TYPES.join(',')}
								className="sr-only"
								aria-invalid={isInvalid || errors.length > 0}
								aria-describedby={
									[describedBy, errors.length > 0 && errorId]
										.filter(Boolean)
										.join(' ') || undefined
								}
								onChange={handleInputChange}
								data-cy={FILE_DROP.INPUT}
							/>
						</label>
						{files.length > 0 && (
							<ul
								ref={listRef}
								className="m-2.5 flex list-none flex-col gap-2.5 p-0"
								aria-label={GLOBAL.FILE_LIST_LABEL}
								data-cy={FILE_DROP.LIST}>
								{files.map((file, index) => (
									<FilePreview
										key={file.id}
										file={file}
										onRemove={handleRemove}
										onAltChange={handleAltChange}
										showAltHelp={index === 0}
									/>
								))}
							</ul>
						)}
					</>
				)}
			</FileDrop>
			{errors.length > 0 && (
				<div
					id={errorId}
					role="alert"
					className="text-danger-text [&>p]:my-1"
					data-cy={FILE_DROP.ERRORS}>
					{errors.map((error) => (
						<p key={error}>{error}</p>
					))}
				</div>
			)}
		</div>
	)
}

AddFile.propTypes = {
	id: PropTypes.string,
	onFilesUpdated: PropTypes.func,
	isInvalid: PropTypes.bool,
	describedBy: PropTypes.string,
}

export default AddFile
