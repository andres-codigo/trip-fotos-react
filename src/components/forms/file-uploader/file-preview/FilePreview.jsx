import PropTypes from 'prop-types'

import { FILE_PREVIEW } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import { cn } from '@/utils/cn'

const badgeClasses =
	'absolute right-1 h-6 appearance-none rounded-full border-0 p-0 shadow-[0_0_5px_currentColor]'

const FilePreview = ({ file, onRemove, tag: Tag = 'li' }) => {
	const isImage = file.type?.startsWith('image/')

	return (
		<Tag
			// Important margins: the global li reset is unlayered, so it beats utilities
			className="relative mx-[2.5%]! my-4! aspect-square w-[20%] min-w-25 overflow-hidden [@media(max-width:440px)]:w-[45%]"
			data-cy={FILE_PREVIEW.ID}>
			<button
				type="button"
				className={cn(
					badgeClasses,
					'top-1 z-1 w-6 cursor-pointer bg-danger text-2xl leading-6 text-on-danger',
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
				className="absolute inset-x-0 bottom-0 truncate bg-scrim px-2 py-1 text-[0.75rem] text-text"
				title={file.name}
				data-cy={FILE_PREVIEW.NAME}>
				{file.name}
			</span>
		</Tag>
	)
}

FilePreview.propTypes = {
	file: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		url: PropTypes.string,
		type: PropTypes.string,
	}).isRequired,
	onRemove: PropTypes.func.isRequired,
	tag: PropTypes.elementType,
}

export default FilePreview
