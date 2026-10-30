import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseImage from '@/components/ui/image/BaseImage'

// Header, caption, footer and the dialog's own padding take about 14rem of the viewport height, so the photo's max-h leaves 16rem
const navClasses =
	'h-10 w-10 flex-none cursor-pointer rounded-full border-0 bg-accent-foreground p-0 pb-[0.2rem] text-[1.75rem] leading-none text-primary-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30 [@media(max-width:480px)]:h-8 [@media(max-width:480px)]:w-8 [@media(max-width:480px)]:text-2xl'

// With a `urlParam` the open photo lives in the URL as a 1-based number, so it can be shared and Back closes it
const ImageGallery = ({ title, urls, dimensions, urlParam }) => {
	const [searchParams, setSearchParams] = useSearchParams()
	const [localIndex, setLocalIndex] = useState(null)
	const [failed, setFailed] = useState(() => new Set())

	const paramIndex = urlParam ? Number(searchParams.get(urlParam)) - 1 : null
	const rawIndex = urlParam ? paramIndex : localIndex
	const index =
		Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < urls.length
			? rawIndex
			: null
	const isOpen = index !== null

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
	const showPrevious = () => goTo(index - 1)
	const showNext = () => goTo(index + 1)
	const close = useCallback(() => goTo(null), [goTo])

	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (event) => {
			if (event.key === 'ArrowLeft' && hasPrevious) goTo(index - 1)
			if (event.key === 'ArrowRight' && hasNext) goTo(index + 1)
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, index, hasPrevious, hasNext, goTo])

	const alt = `${title}'s photo ${isOpen ? index + 1 : ''}`.trim()

	return (
		<>
			{urls.map((url, position) => (
				<BaseImage
					key={url}
					title={title}
					url={url}
					dimensions={dimensions?.[position]}
					onOpen={() => goTo(position, { replace: false })}
				/>
			))}
			<BaseDialog
				show={isOpen}
				title={`${title}'s photos`}
				sectionClasses
				onClose={close}>
				{isOpen && (
					<div
						className={
							'box-border flex w-full items-center justify-center gap-2 px-2'
						}>
						<button
							type="button"
							className={navClasses}
							aria-label="Previous photo"
							disabled={!hasPrevious}
							onClick={showPrevious}
							data-cy={IMAGE.PREVIOUS}>
							&#8249;
						</button>
						<figure
							className={
								'm-0 flex min-w-0 flex-1 flex-col items-center [&_img]:mx-auto [&_img]:block [&_img]:h-auto [&_img]:max-h-[calc(100dvh-16rem)] [&_img]:w-auto [&_img]:max-w-full [&_img]:object-contain [&_img]:p-0 [&_figcaption]:mt-2 [&_figcaption]:text-[0.875rem] [&_figcaption]:text-card-foreground'
							}>
							{failed.has(urls[index]) ? (
								<span
									className={
										'block p-4 text-center text-card-foreground'
									}
									role="img"
									aria-label={`${alt} is unavailable`}
									data-cy={IMAGE.FALLBACK}>
									{GLOBAL.IMAGE_UNAVAILABLE}
								</span>
							) : (
								<img
									key={urls[index]}
									src={urls[index]}
									alt={alt}
									onError={() =>
										setFailed((prev) =>
											new Set(prev).add(urls[index]),
										)
									}
									data-cy={IMAGE.FULL}
								/>
							)}
							<figcaption
								aria-live="polite"
								data-cy={IMAGE.COUNTER}>
								{index + 1} of {urls.length}
							</figcaption>
						</figure>
						<button
							type="button"
							className={navClasses}
							aria-label="Next photo"
							disabled={!hasNext}
							onClick={showNext}
							data-cy={IMAGE.NEXT}>
							&#8250;
						</button>
					</div>
				)}
			</BaseDialog>
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
	urlParam: PropTypes.string,
}

export default ImageGallery
