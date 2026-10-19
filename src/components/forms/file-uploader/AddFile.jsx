import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { FILE_UPLOAD } from '@/constants/validation'
import { FILE_DROP } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import FileDrop from '@/components/forms/file-uploader/file-drop/FileDrop'
import FilePreview from '@/components/forms/file-uploader/file-preview/FilePreview'
import useFileList from '@/components/forms/file-uploader/hooks/useFileList'

import addFileStyles from './AddFile.module.scss'

const { FILE_DROP_TEXT } = GLOBAL

const AddFile = ({ id = 'file-input', onFilesUpdated }) => {
	const { files, errors, addFiles, removeFile } = useFileList()
	const errorId = `${id}-error`

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

	const handleInputChange = (event) => {
		addFiles(event.target.files)
		// Reset so choosing the same file again still fires change
		event.target.value = ''
	}

	return (
		<div className={addFileStyles.addFile}>
			<FileDrop onFilesDropped={addFiles}>
				{({ isActive }) => (
					<>
						<label
							htmlFor={id}
							className={addFileStyles.label}>
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
										<strong>
											<em>
												{
													FILE_DROP_TEXT.IDLE_HINT_ACTION
												}
											</em>
										</strong>{' '}
										{FILE_DROP_TEXT.IDLE_HINT_SUFFIX}
									</span>
								</>
							)}
							<input
								id={id}
								type="file"
								multiple
								accept={FILE_UPLOAD.ACCEPTED_TYPES.join(',')}
								className={addFileStyles.input}
								aria-invalid={errors.length > 0}
								aria-describedby={
									errors.length > 0 ? errorId : undefined
								}
								onChange={handleInputChange}
								data-cy={FILE_DROP.INPUT}
							/>
						</label>
						{files.length > 0 && (
							<ul
								className={addFileStyles.fileList}
								aria-label={GLOBAL.FILE_LIST_LABEL}
								data-cy={FILE_DROP.LIST}>
								{files.map((file) => (
									<FilePreview
										key={file.id}
										file={file}
										onRemove={removeFile}
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
					className={addFileStyles.errors}
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
}

export default AddFile
