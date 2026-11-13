import { useState } from 'react'
import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'
import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

const PLACEHOLDER_DIMENSIONS = { width: 4, height: 3 }

const BaseImage = ({
	title,
	url,
	dimensions,
	thumbnails,
	description = '',
	sizes = GLOBAL.IMAGE_THUMBNAIL_SIZES,
	onOpen,
}) => {
	const [hasError, setHasError] = useState(false)
	const [isThumbnailFailed, setIsThumbnailFailed] = useState(false)

	const alt = description || `${title}'s photo`
	const { width, height } = dimensions ?? PLACEHOLDER_DIMENSIONS

	// Photos uploaded before thumbnails existed, or whose thumbnail fails, load the original
	const sources =
		!isThumbnailFailed && thumbnails?.length
			? [...thumbnails].sort((a, b) => a.width - b.width)
			: null
	const handleError = () =>
		sources ? setIsThumbnailFailed(true) : setHasError(true)

	const image = (
		<img
			src={sources ? sources[0].url : url}
			srcSet={sources
				?.map((source) => `${source.url} ${source.width}w`)
				.join(', ')}
			sizes={sources ? sizes : undefined}
			alt={alt}
			width={width}
			height={height}
			loading="lazy"
			onError={handleError}
			data-cy={IMAGE.THUMBNAIL}
		/>
	)

	return (
		<li
			className={cn(
				'relative aspect-square w-[32%] overflow-hidden bg-surface-sunken [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover [@media(max-width:480px)]:w-[48%]',
				onOpen && 'tile-focus-ring [&_img]:cursor-pointer',
			)}
			data-cy={IMAGE.ID}>
			{/* Nothing to enlarge, so the fallback is not a button */}
			{hasError ? (
				<span
					className="flex h-full items-center justify-center p-4 text-center text-text-muted"
					role="img"
					aria-label={`${alt} is unavailable`}
					data-cy={IMAGE.FALLBACK}>
					{GLOBAL.IMAGE_UNAVAILABLE}
				</span>
			) : onOpen ? (
				<button
					type="button"
					className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
					aria-label={
						description
							? `View ${title}'s photo: ${description}`
							: `View ${title}'s photo`
					}
					onClick={onOpen}
					data-cy={IMAGE.BUTTON}>
					{image}
				</button>
			) : (
				image
			)}
		</li>
	)
}

BaseImage.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	url: PropTypes.string.isRequired,
	dimensions: PropTypes.shape({
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
	}),
	thumbnails: PropTypes.arrayOf(
		PropTypes.shape({
			width: PropTypes.number.isRequired,
			url: PropTypes.string.isRequired,
		}),
	),
	// The tile's rendered width, so the browser picks the smallest thumbnail that fills it
	sizes: PropTypes.string,
	// Without it the tile is a plain image, for a preview with nothing to enlarge
	onOpen: PropTypes.func,
}

export default BaseImage
