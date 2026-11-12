import { useId } from 'react'
import PropTypes from 'prop-types'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'
import { FILE_UPLOAD } from '@/constants/validation'

import Input from '@/components/ui/form/input/Input'

const formatSize = (bytes) =>
	bytes >= 1024 * 1024
		? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`

const FilePreview = ({
	file,
	onRemove,
	onAltChange,
	showAltHelp = false,
	disabled = false,
	tag: Tag = 'li',
}) => {
	const altId = useId()
	const isImage = file.type?.startsWith('image/')

	return (
		<Tag
			className="grid grid-cols-[4rem_minmax(0,1fr)_2.75rem] items-start gap-x-3 gap-y-2 rounded-md border border-border-strong bg-surface-sunken p-2.5 text-left"
			data-cy={FILE_PREVIEW.ID}>
			{isImage ? (
				<img
					src={file.url}
					alt=""
					className="block size-16 rounded-sm object-cover"
					data-cy={FILE_PREVIEW.THUMBNAIL}
				/>
			) : (
				<span className="block size-16 rounded-sm bg-surface" />
			)}
			<span className="flex min-w-0 flex-col text-sm">
				<span
					className="truncate font-semibold"
					title={file.name}
					data-cy={FILE_PREVIEW.NAME}>
					{file.name}
				</span>
				{file.size > 0 && (
					<span className="text-text-muted">
						{formatSize(file.size)}
					</span>
				)}
			</span>
			<button
				type="button"
				className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-2xl leading-none text-text hover:bg-surface-accent disabled:cursor-not-allowed disabled:opacity-40"
				aria-label={GLOBAL.REMOVE_FILE_LABEL(file.name)}
				onClick={() => onRemove(file)}
				disabled={disabled}
				data-cy={FILE_PREVIEW.REMOVE_BUTTON}>
				<span aria-hidden="true">&times;</span>
			</button>
			<div className="col-span-3">
				<Input
					id={altId}
					label={GLOBAL.PHOTO_ALT.LABEL}
					helpText={showAltHelp ? GLOBAL.PHOTO_ALT.HELP : ''}
					value={file.alt ?? ''}
					onChange={(e) => onAltChange(file, e.target.value)}
					maxLength={FILE_UPLOAD.ALT_MAX_LENGTH}
					disabled={disabled}
					data-cy={FILE_PREVIEW.ALT_INPUT}
				/>
			</div>
		</Tag>
	)
}

FilePreview.propTypes = {
	file: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		size: PropTypes.number,
		url: PropTypes.string,
		type: PropTypes.string,
		alt: PropTypes.string,
	}).isRequired,
	onRemove: PropTypes.func.isRequired,
	onAltChange: PropTypes.func.isRequired,
	showAltHelp: PropTypes.bool,
	disabled: PropTypes.bool,
	tag: PropTypes.elementType,
}

export default FilePreview
