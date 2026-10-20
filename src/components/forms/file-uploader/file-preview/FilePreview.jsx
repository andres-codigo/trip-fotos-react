import PropTypes from 'prop-types'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import filePreviewStyles from './FilePreview.module.scss'

const FilePreview = ({ file, onRemove, tag: Tag = 'li' }) => {
	const isImage = file.type?.startsWith('image/')
	const statusLabel = file.status && GLOBAL.FILE_STATUS_LABEL[file.status]

	return (
		<Tag
			className={filePreviewStyles.filePreview}
			data-cy={FILE_PREVIEW.ID}>
			<button
				type="button"
				className={filePreviewStyles.removeButton}
				aria-label={GLOBAL.REMOVE_FILE_LABEL(file.name)}
				onClick={() => onRemove(file)}
				data-cy={FILE_PREVIEW.REMOVE_BUTTON}>
				<span aria-hidden="true">&times;</span>
			</button>
			{isImage && (
				<img
					src={file.url}
					alt=""
					className={filePreviewStyles.thumbnail}
					data-cy={FILE_PREVIEW.THUMBNAIL}
				/>
			)}
			<span
				className={filePreviewStyles.name}
				title={file.name}
				data-cy={FILE_PREVIEW.NAME}>
				{file.name}
			</span>
			{statusLabel && (
				<span
					role="status"
					className={`${filePreviewStyles.status} ${filePreviewStyles[file.status]}`}
					data-cy={FILE_PREVIEW.STATUS}>
					{statusLabel}
				</span>
			)}
		</Tag>
	)
}

FilePreview.propTypes = {
	file: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		url: PropTypes.string,
		type: PropTypes.string,
		status: PropTypes.oneOf(Object.values(GLOBAL.FILE_STATUS)),
	}).isRequired,
	onRemove: PropTypes.func.isRequired,
	tag: PropTypes.elementType,
}

export default FilePreview
