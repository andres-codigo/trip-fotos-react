import PropTypes from 'prop-types'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { cn } from '@/utils/cn'

const badgeClasses =
	'absolute right-1 size-6 appearance-none rounded-[24px] border-0 p-0 leading-6 shadow-[0_0_5px_currentColor]'

const statusClasses = {
	[GLOBAL.FILE_STATUS.LOADING]:
		'animate-file-pulse text-black motion-reduce:animate-none motion-reduce:bg-border',
	[GLOBAL.FILE_STATUS.UPLOADED]: 'bg-[#66c360] text-black',
	[GLOBAL.FILE_STATUS.ERROR]: 'bg-[#933933] text-white',
}

const FilePreview = ({ file, onRemove, tag: Tag = 'li' }) => {
	const isImage = file.type?.startsWith('image/')
	const statusLabel = file.status && GLOBAL.FILE_STATUS_LABEL[file.status]

	return (
		<Tag
			className="relative m-4 mx-[2.5%] aspect-square w-[20%] min-w-25 overflow-hidden max-[440px]:w-[45%]"
			data-cy={FILE_PREVIEW.ID}>
			<button
				type="button"
				className={cn(
					badgeClasses,
					'top-1 z-1 cursor-pointer bg-[#933933] text-[24px] text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent',
				)}
				aria-label={GLOBAL.REMOVE_FILE_LABEL(file.name)}
				onClick={() => onRemove(file)}
				data-cy={FILE_PREVIEW.REMOVE_BUTTON}>
				<span aria-hidden="true">&times;</span>
			</button>
			{isImage && (
				<img
					src={file.url}
					alt=""
					className="block size-full object-cover"
					data-cy={FILE_PREVIEW.THUMBNAIL}
				/>
			)}
			<span
				className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs text-white"
				title={file.name}
				data-cy={FILE_PREVIEW.NAME}>
				{file.name}
			</span>
			{statusLabel && (
				<span
					role="status"
					className={cn(
						badgeClasses,
						'bottom-8 px-2.5 text-[14.4px]',
						statusClasses[file.status],
					)}
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
