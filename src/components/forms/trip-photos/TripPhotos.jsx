import { useEffect, useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { TRIP_PHOTOS } from '@/constants/test'
import { TRIP_PHOTOS_CONFIG } from '@/constants/travellers'
import { GLOBAL } from '@/constants/ui'

import { cn } from '@/utils/cn'

import Input from '@/components/ui/form/input/Input'
import { FILE_UPLOAD } from '@/constants/validation'

const resetButtonClasses =
	'cursor-pointer appearance-none border-0 bg-transparent p-0 disabled:cursor-not-allowed'

// The ring sits on the 24px disc, not the 44px hit area, so it matches the file-preview remove button
const removeButtonClasses = cn(
	resetButtonClasses,
	'group absolute top-0 right-0 z-1 flex size-11 items-start justify-end p-2.5 focus-visible:outline-none',
)

const discClasses =
	'flex size-6 items-center justify-center rounded-full bg-danger text-on-danger shadow-[0_0_5px_currentColor] group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus group-disabled:opacity-40'

const CrossIcon = () => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		className="size-4"
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinecap="round">
		<path d="M6 6l12 12M18 6L6 18" />
	</svg>
)

// Mirrors BaseImage's thumbnail fallback; BaseImage itself is a list item with a view button, which a tile here cannot nest
const TilePhoto = ({ url, dimensions, thumbnails, isRemoved }) => {
	const [hasError, setHasError] = useState(false)
	const [isThumbnailFailed, setIsThumbnailFailed] = useState(false)

	const sources =
		!isThumbnailFailed && thumbnails?.length
			? [...thumbnails].sort((a, b) => a.width - b.width)
			: null
	const handleError = () =>
		sources ? setIsThumbnailFailed(true) : setHasError(true)

	if (hasError) {
		return (
			<span className="flex size-full items-center justify-center p-2 text-center text-xs text-text-muted">
				{GLOBAL.IMAGE_UNAVAILABLE}
			</span>
		)
	}

	return (
		<img
			src={sources ? sources[0].url : url}
			srcSet={sources
				?.map((source) => `${source.url} ${source.width}w`)
				.join(', ')}
			sizes={sources ? GLOBAL.IMAGE_THUMBNAIL_SIZES : undefined}
			alt=""
			width={dimensions?.width}
			height={dimensions?.height}
			loading="lazy"
			onError={handleError}
			className={cn(
				'block size-full object-cover',
				isRemoved && 'opacity-25',
			)}
		/>
	)
}

TilePhoto.propTypes = {
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
	isRemoved: PropTypes.bool.isRequired,
}

const TripPhotos = ({
	photos,
	removedUrls = [],
	newCount = 0,
	alts = {},
	onRemove,
	onUndo,
	onAltChange,
	disabled = false,
	className,
}) => {
	const hintId = useId()
	const listRef = useRef(null)
	const previousRemoved = useRef(removedUrls)

	const total = photos.length
	const removedCount = photos.filter(({ url }) =>
		removedUrls.includes(url),
	).length
	const keptCount = total - removedCount
	const isLastPhoto = keptCount + newCount <= 1

	// Focus follows the tile the user acted on, since the button they pressed is replaced
	useEffect(() => {
		const previous = previousRemoved.current
		previousRemoved.current = removedUrls

		const justRemoved = removedUrls.find((url) => !previous.includes(url))
		const justUndone = previous.find((url) => !removedUrls.includes(url))

		const changedUrl = justRemoved ?? justUndone
		if (!changedUrl) return

		// Each tile holds one button, Remove or Undo, so the tile's button is the one to focus
		const index = photos.findIndex(({ url }) => url === changedUrl)
		listRef.current?.children[index]?.querySelector('button')?.focus()
	}, [photos, removedUrls])

	if (!total) {
		return (
			<div
				className={cn('flex flex-col gap-2', className)}
				data-cy={TRIP_PHOTOS.ROOT}>
				<p className="m-0 text-text-muted">
					{TRIP_PHOTOS_CONFIG.EMPTY_HINT}
				</p>
			</div>
		)
	}

	const countText =
		removedCount || newCount
			? TRIP_PHOTOS_CONFIG.COUNT_AFTER_SAVE(
					keptCount + newCount,
					removedCount,
					newCount,
				)
			: TRIP_PHOTOS_CONFIG.COUNT(total)

	return (
		<div
			className={cn('flex flex-col gap-2', className)}
			data-cy={TRIP_PHOTOS.ROOT}>
			<p
				role="status"
				className="m-0 text-sm text-text-muted"
				data-cy={TRIP_PHOTOS.COUNT}>
				{countText}
			</p>
			<ul
				ref={listRef}
				aria-label={TRIP_PHOTOS_CONFIG.LIST_LABEL}
				className="m-0 grid list-none grid-cols-2 gap-x-2 gap-y-4 p-0 sm:grid-cols-4">
				{photos.map(({ url, dimensions, thumbnails }, index) => {
					const isRemoved = removedUrls.includes(url)
					const position = index + 1

					return (
						<li
							key={url}
							className="flex min-w-0 flex-col gap-2"
							data-cy={TRIP_PHOTOS.TILE}>
							<div className="relative aspect-square overflow-hidden rounded-sm bg-surface-sunken">
								<TilePhoto
									url={url}
									dimensions={dimensions}
									thumbnails={thumbnails}
									isRemoved={isRemoved}
								/>
								{isRemoved ? (
									<div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
										<span
											className="text-xs text-text"
											data-cy={TRIP_PHOTOS.REMOVED}>
											{TRIP_PHOTOS_CONFIG.REMOVED_LABEL}
										</span>
										<button
											type="button"
											className={cn(
												resetButtonClasses,
												'min-h-11 px-2 text-sm font-semibold text-accent-text underline disabled:opacity-40',
											)}
											aria-label={TRIP_PHOTOS_CONFIG.UNDO_LABEL(
												position,
												total,
											)}
											disabled={disabled}
											onClick={() => onUndo(url)}
											data-cy={TRIP_PHOTOS.UNDO}>
											{TRIP_PHOTOS_CONFIG.UNDO}
										</button>
									</div>
								) : (
									<button
										type="button"
										className={removeButtonClasses}
										aria-label={TRIP_PHOTOS_CONFIG.REMOVE_LABEL(
											position,
											total,
										)}
										aria-describedby={
											isLastPhoto ? hintId : undefined
										}
										disabled={disabled || isLastPhoto}
										onClick={() => onRemove(url)}
										data-cy={TRIP_PHOTOS.REMOVE}>
										<span className={discClasses}>
											<CrossIcon />
										</span>
									</button>
								)}
							</div>
							<Input
								id={`${hintId}-alt-${position}`}
								label={GLOBAL.PHOTO_ALT.LABEL_FOR(position)}
								value={alts[url] ?? ''}
								onChange={(e) =>
									onAltChange(url, e.target.value)
								}
								maxLength={FILE_UPLOAD.ALT_MAX_LENGTH}
								disabled={disabled || isRemoved}
								className="text-sm"
								data-cy={TRIP_PHOTOS.ALT_INPUT}
							/>
						</li>
					)
				})}
			</ul>
			{isLastPhoto && (
				<p
					id={hintId}
					className="m-0 text-sm text-text-muted"
					data-cy={TRIP_PHOTOS.LAST_PHOTO_HINT}>
					{TRIP_PHOTOS_CONFIG.LAST_PHOTO_HINT}
				</p>
			)}
		</div>
	)
}

const photoShape = PropTypes.shape({
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
})

TripPhotos.propTypes = {
	photos: PropTypes.arrayOf(photoShape).isRequired,
	removedUrls: PropTypes.arrayOf(PropTypes.string),
	newCount: PropTypes.number,
	alts: PropTypes.objectOf(PropTypes.string),
	onRemove: PropTypes.func.isRequired,
	onUndo: PropTypes.func.isRequired,
	onAltChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
	className: PropTypes.string,
}

export default TripPhotos
