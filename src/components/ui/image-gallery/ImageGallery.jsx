import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import * as RadixDialog from '@radix-ui/react-dialog'
import PropTypes from 'prop-types'

import { DIALOG, IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseImage from '@/components/ui/image/BaseImage'
import BaseSpinner from '@/components/ui/spinner/BaseSpinner'
import { cn } from '@/utils/cn'

const PLACEHOLDER_DIMENSIONS = { width: 4, height: 3 }
// A photo that loads within this time never shows the spinner
const SLOW_LOAD_MS = 400
// Scroll events stop this long after a swipe or a smooth scroll settles
const SCROLL_SETTLE_MS = 120
// Swipe down to close: the gesture picks its axis after this much movement, closes past this share of the photo area's height or on a flick this fast, and the backdrop fades to this opacity at the threshold
const AXIS_LOCK_PX = 10
const CLOSE_SHARE = 0.25
const FLICK_PX_PER_MS = 0.5
const FADED_OPACITY = 0.4
const RESTING = { y: 0, threshold: 1, isActive: false }

// On phones, either way up, the arrows share the counter's row at the screen's edges; from 769px on a taller screen they sit in the side margins
const iconButtonClasses =
	'inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border border-solid border-border-card bg-surface p-0 text-text hover:bg-surface-accent disabled:cursor-default disabled:opacity-35 disabled:hover:bg-surface'
const sideButtonClasses =
	'absolute top-1/2 size-14 -translate-y-1/2 phone:static phone:size-11 phone:translate-y-0'

const Icon = ({ path, size = 22 }) => (
	<svg
		aria-hidden="true"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d={path} />
	</svg>
)

Icon.propTypes = { path: PropTypes.string.isRequired, size: PropTypes.number }

const CLOSE_PATH = 'M18 6 6 18M6 6l12 12'
const PREVIOUS_PATH = 'm15 18-6-6 6-6'
const NEXT_PATH = 'm9 18 6-6-6-6'

const smallestFirst = (thumbnails) =>
	thumbnails?.length
		? [...thumbnails].sort((a, b) => a.width - b.width)
		: null

// One screen of the track. Only the open photo and its neighbours load, so a swipe lands on a photo that is ready
const Slide = ({
	url,
	alt,
	isCurrent,
	isNear,
	hasFailed,
	isLoaded,
	thumbnails,
	dimensions,
	sizes,
	onLoad,
	onError,
}) => {
	const sources = smallestFirst(thumbnails)
	const { width, height } = dimensions ?? PLACEHOLDER_DIMENSIONS

	let content = null
	if (isNear && hasFailed) {
		content = (
			<span
				className="flex aspect-[4/3] max-h-full w-full max-w-[26.25rem] flex-col items-center justify-center gap-2.5 rounded-sm border border-solid border-border-card bg-surface text-text-muted"
				role="img"
				aria-label={`${alt} is unavailable`}
				data-cy={isCurrent ? IMAGE.FALLBACK : undefined}>
				<svg
					aria-hidden="true"
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round">
					<rect
						x="3"
						y="4"
						width="18"
						height="16"
						rx="2"
					/>
					<path d="m3 16 5-5 4 4M14 13l2-2 5 5M4 4l16 16" />
				</svg>
				{GLOBAL.IMAGE_UNAVAILABLE}
			</span>
		)
	} else if (isNear) {
		content = (
			<span className="relative block h-full w-full">
				{/* The tile's thumbnail is already loaded, so it holds the photo's place until the full photo arrives */}
				{!isLoaded &&
					(sources ? (
						<img
							className="absolute inset-0 h-full w-full object-contain blur-xs"
							src={sources[0].url}
							srcSet={sources
								.map(
									(source) =>
										`${source.url} ${source.width}w`,
								)
								.join(', ')}
							sizes={sizes}
							alt=""
						/>
					) : (
						<svg
							className="absolute inset-0 h-full w-full"
							aria-hidden="true"
							viewBox={`0 0 ${width} ${height}`}
							preserveAspectRatio="xMidYMid meet">
							<rect
								className="animate-skeleton fill-skeleton"
								width={width}
								height={height}
							/>
						</svg>
					))}
				<img
					className={cn(
						'relative block h-full w-full object-contain',
						!isLoaded && 'opacity-0',
					)}
					src={url}
					alt={isCurrent ? alt : ''}
					onLoad={onLoad}
					onError={onError}
					data-cy={isCurrent ? IMAGE.FULL : undefined}
				/>
			</span>
		)
	}

	return (
		<div
			className="flex h-full w-full flex-none snap-center items-center justify-center px-26 phone:px-4"
			aria-hidden={!isCurrent}>
			{content}
		</div>
	)
}

Slide.propTypes = {
	url: PropTypes.string.isRequired,
	alt: PropTypes.string.isRequired,
	isCurrent: PropTypes.bool.isRequired,
	isNear: PropTypes.bool.isRequired,
	hasFailed: PropTypes.bool.isRequired,
	isLoaded: PropTypes.bool.isRequired,
	thumbnails: PropTypes.array,
	dimensions: PropTypes.object,
	sizes: PropTypes.string,
	onLoad: PropTypes.func.isRequired,
	onError: PropTypes.func.isRequired,
}

// With a `urlParam` the open photo lives in the URL as a 1-based number, so it can be shared and Back closes it
const ImageGallery = ({
	title,
	urls,
	dimensions,
	thumbnails,
	alts,
	sizes,
	urlParam,
}) => {
	const [searchParams, setSearchParams] = useSearchParams()
	const [localIndex, setLocalIndex] = useState(null)
	const [failed, setFailed] = useState(() => new Set())
	const [loaded, setLoaded] = useState(() => new Set())
	const [slowUrl, setSlowUrl] = useState(null)
	const [track, setTrack] = useState(null)
	// How far below its place the photo sits while it is swiped down, and whether the finger is still on it
	const [drag, setDrag] = useState(RESTING)
	const gestureRef = useRef(null)
	const indexRef = useRef(null)
	const settleTimerRef = useRef(null)
	// Radix only returns focus to its own Trigger, so the lightbox remembers the tile that opened it
	const openerRef = useRef(null)

	const paramIndex = urlParam ? Number(searchParams.get(urlParam)) - 1 : null
	const rawIndex = urlParam ? paramIndex : localIndex
	const index =
		Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < urls.length
			? rawIndex
			: null
	const isOpen = index !== null
	useLayoutEffect(() => {
		indexRef.current = index
	}, [index])

	const goTo = useCallback(
		(next, { replace = true } = {}) => {
			if (!urlParam) {
				setLocalIndex(next)
				return
			}
			setSearchParams(
				(prev) => {
					const params = new URLSearchParams(prev)
					if (next === null) params.delete(urlParam)
					else params.set(urlParam, String(next + 1))
					return params
				},
				{ replace },
			)
		},
		[setSearchParams, urlParam],
	)

	const hasPrevious = isOpen && index > 0
	const hasNext = isOpen && index < urls.length - 1
	const close = useCallback(() => goTo(null), [goTo])

	const scrollToIndex = (track, position, behavior) => {
		const left = position * track.clientWidth
		if (Math.abs(track.scrollLeft - left) < 1) return
		if (typeof track.scrollTo === 'function')
			track.scrollTo({ left, behavior })
		else track.scrollLeft = left
	}

	// The dialog attaches the track a render after it opens, so the track is state: a new track jumps straight to the photo, and stepping scrolls to it
	const wasPlacedRef = useRef(false)
	useLayoutEffect(() => {
		if (!track || index === null) {
			wasPlacedRef.current = false
			return
		}
		const reduceMotion = window.matchMedia?.(
			'(prefers-reduced-motion: reduce)',
		).matches
		const behavior =
			wasPlacedRef.current && !reduceMotion ? 'smooth' : 'auto'
		wasPlacedRef.current = true
		scrollToIndex(track, index, behavior)
	}, [track, index])

	useEffect(() => () => clearTimeout(settleTimerRef.current), [])

	// A swipe settles on a photo through scroll-snap; once it stops, that photo becomes the open one
	const handleScroll = () => {
		clearTimeout(settleTimerRef.current)
		settleTimerRef.current = setTimeout(() => {
			if (!track?.clientWidth) return
			const position = Math.round(track.scrollLeft / track.clientWidth)
			// A smooth scroll that pauses between photos is not a swipe: only a position on a photo counts
			const isSnapped =
				Math.abs(track.scrollLeft - position * track.clientWidth) < 1
			if (
				isSnapped &&
				position !== indexRef.current &&
				position >= 0 &&
				position < urls.length
			)
				goTo(position)
		}, SCROLL_SETTLE_MS)
	}

	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (event) => {
			if (event.key === 'ArrowLeft' && hasPrevious) goTo(index - 1)
			if (event.key === 'ArrowRight' && hasNext) goTo(index + 1)
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, index, hasPrevious, hasNext, goTo])

	const handleTouchStart = (event) => {
		if (event.touches.length !== 1) {
			gestureRef.current = null
			return
		}
		const { clientX, clientY } = event.touches[0]
		gestureRef.current = {
			x: clientX,
			y: clientY,
			axis: null,
			dy: 0,
			time: event.timeStamp,
			speed: 0,
			threshold: event.currentTarget.clientHeight * CLOSE_SHARE,
			isStill: window.matchMedia?.('(prefers-reduced-motion: reduce)')
				.matches,
		}
	}

	const handleTouchMove = (event) => {
		const gesture = gestureRef.current
		if (!gesture || event.touches.length !== 1) return
		const { clientX, clientY } = event.touches[0]
		const dx = clientX - gesture.x
		const dy = clientY - gesture.y
		if (!gesture.axis) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return
			gesture.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
		}
		if (gesture.axis !== 'y') return
		const elapsed = event.timeStamp - gesture.time
		if (elapsed > 0) gesture.speed = (dy - gesture.dy) / elapsed
		gesture.dy = dy
		gesture.time = event.timeStamp
		if (!gesture.isStill)
			setDrag({
				y: Math.max(dy, 0),
				threshold: gesture.threshold,
				isActive: true,
			})
	}

	const handleTouchEnd = () => {
		const gesture = gestureRef.current
		gestureRef.current = null
		if (gesture?.axis !== 'y') return
		const isPastThreshold =
			gesture.dy >= gesture.threshold ||
			(gesture.dy > 0 && gesture.speed >= FLICK_PX_PER_MS)
		if (!isPastThreshold) {
			setDrag(RESTING)
			return
		}
		// The photo stays where it was let go while the lightbox fades out
		setDrag((prev) => ({ ...prev, isActive: false }))
		close()
	}

	const fadeOpacity =
		1 - (1 - FADED_OPACITY) * Math.min(drag.y / drag.threshold, 1)
	const backdropStyle =
		fadeOpacity < 1
			? {
					backgroundColor: `color-mix(in srgb, var(--color-surface-sunken) ${fadeOpacity * 100}%, transparent)`,
				}
			: undefined
	const barStyle = fadeOpacity < 1 ? { opacity: fadeOpacity } : undefined
	const settleClasses =
		!drag.isActive &&
		'transition-[transform,opacity,background-color] duration-300 ease-out'

	const currentUrl = isOpen ? urls[index] : null
	const isCurrentSettled =
		currentUrl !== null &&
		(loaded.has(currentUrl) || failed.has(currentUrl))

	useEffect(() => {
		if (currentUrl === null || isCurrentSettled) return
		const timer = setTimeout(() => setSlowUrl(currentUrl), SLOW_LOAD_MS)
		return () => clearTimeout(timer)
	}, [currentUrl, isCurrentSettled])

	const altFor = (position) =>
		alts?.[position] || `${title}'s photo ${position + 1}`
	const description = isOpen ? (alts?.[index] ?? '') : ''
	const addTo = (setter, url) =>
		setter((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))

	return (
		<>
			{urls.map((url, position) => (
				<BaseImage
					key={url}
					title={title}
					url={url}
					dimensions={dimensions?.[position]}
					thumbnails={thumbnails?.[position]}
					description={alts?.[position] ?? ''}
					sizes={sizes}
					onOpen={() => goTo(position, { replace: false })}
				/>
			))}
			<RadixDialog.Root
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) close()
				}}>
				<RadixDialog.Portal>
					{/* Radix locks the page scroll only while an Overlay is rendered */}
					<RadixDialog.Overlay
						className={cn(
							'fixed inset-0 z-100 bg-surface-sunken',
							settleClasses,
						)}
						style={backdropStyle}
					/>
					<RadixDialog.Content
						className={cn(
							'fixed inset-0 z-100 flex flex-col bg-surface-sunken pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-text outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
							settleClasses,
						)}
						style={backdropStyle}
						aria-describedby={undefined}
						// Runs before focus moves into the lightbox, so the tile is still focused
						onOpenAutoFocus={() => {
							openerRef.current = document.activeElement
						}}
						onCloseAutoFocus={(e) => {
							e.preventDefault()
							openerRef.current?.focus()
							setDrag(RESTING)
						}}>
						{isOpen && (
							<>
								<div
									className={cn(
										'flex h-16 flex-none items-center justify-between gap-3 pr-2.5 pl-5',
										settleClasses,
									)}
									style={barStyle}>
									<RadixDialog.Title
										className="m-0 min-w-0 truncate text-[0.9375rem] font-medium text-text-muted"
										data-cy={DIALOG.TITLE}>
										{`${title}'s photos`}
									</RadixDialog.Title>
									<RadixDialog.Close
										type="button"
										aria-label="Close"
										className={iconButtonClasses}>
										<Icon path={CLOSE_PATH} />
									</RadixDialog.Close>
								</div>
								<div
									className={cn(
										'relative min-h-0 flex-1',
										settleClasses,
									)}
									style={
										drag.y
											? {
													transform: `translateY(${drag.y}px)`,
												}
											: undefined
									}
									onTouchStart={handleTouchStart}
									onTouchMove={handleTouchMove}
									onTouchEnd={handleTouchEnd}
									onTouchCancel={handleTouchEnd}
									data-cy={IMAGE.STAGE}>
									<div
										ref={setTrack}
										// A scrolling region needs keyboard access; its ring sits inside, as its edges meet the screen's
										tabIndex={0}
										role="region"
										aria-label="Photos"
										className="flex h-full touch-pan-x snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden overscroll-x-contain focus-visible:-outline-offset-3 [&::-webkit-scrollbar]:hidden"
										onScroll={handleScroll}
										data-cy={IMAGE.TRACK}>
										{urls.map((url, position) => (
											<Slide
												key={url}
												url={url}
												alt={altFor(position)}
												isCurrent={position === index}
												isNear={
													Math.abs(
														position - index,
													) <= 1
												}
												hasFailed={failed.has(url)}
												isLoaded={loaded.has(url)}
												thumbnails={
													thumbnails?.[position]
												}
												dimensions={
													dimensions?.[position]
												}
												sizes={sizes}
												onLoad={() =>
													addTo(setLoaded, url)
												}
												onError={() =>
													addTo(setFailed, url)
												}
											/>
										))}
									</div>
									{slowUrl === currentUrl &&
										!isCurrentSettled && (
											<BaseSpinner
												label={
													GLOBAL.SPINNER_LABEL.PHOTO
												}
												className="absolute bottom-3.5 left-1/2 h-auto w-auto -translate-x-1/2 rounded-pill bg-surface-sunken/80 px-3 py-1.5 text-sm text-text"
											/>
										)}
								</div>
								<div
									className={cn(
										'flex flex-none flex-col items-center gap-1.5 px-4 pt-3 pb-5 text-center',
										settleClasses,
									)}
									style={barStyle}
									aria-live="polite">
									{description && (
										<p
											className="m-0 max-w-[60ch] text-[0.9375rem] text-pretty"
											data-cy={IMAGE.CAPTION}>
											{description}
										</p>
									)}
									{urls.length > 1 && (
										<div
											// On phones, Previous lines up with the title and Next with Close
											className="flex w-full max-w-80 items-center justify-center phone:-mr-1.5 phone:ml-1 phone:w-auto phone:max-w-none phone:justify-between phone:self-stretch">
											<button
												type="button"
												className={cn(
													iconButtonClasses,
													sideButtonClasses,
													'left-6',
												)}
												aria-label="Previous photo"
												disabled={!hasPrevious}
												onClick={() => goTo(index - 1)}
												data-cy={IMAGE.PREVIOUS}>
												<Icon path={PREVIOUS_PATH} />
											</button>
											<span
												className="text-sm text-text-muted tabular-nums"
												data-cy={IMAGE.COUNTER}>
												{index + 1} of {urls.length}
											</span>
											<button
												type="button"
												className={cn(
													iconButtonClasses,
													sideButtonClasses,
													'right-6',
												)}
												aria-label="Next photo"
												disabled={!hasNext}
												onClick={() => goTo(index + 1)}
												data-cy={IMAGE.NEXT}>
												<Icon path={NEXT_PATH} />
											</button>
										</div>
									)}
								</div>
							</>
						)}
					</RadixDialog.Content>
				</RadixDialog.Portal>
			</RadixDialog.Root>
		</>
	)
}

ImageGallery.propTypes = {
	title: PropTypes.string.isRequired,
	urls: PropTypes.arrayOf(PropTypes.string).isRequired,
	dimensions: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.object),
		PropTypes.object,
	]),
	// The database stores a sparse array as an object keyed by position
	thumbnails: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.array),
		PropTypes.object,
	]),
	// Passed to each tile; BaseImage defaults to the page-card value
	sizes: PropTypes.string,
	// Aligned with urls, sparse like thumbnails
	alts: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.string),
		PropTypes.object,
	]),
	urlParam: PropTypes.string,
}

export default ImageGallery
