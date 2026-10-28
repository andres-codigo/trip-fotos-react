import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseDialog from '@/components/ui/dialog/BaseDialog'
import BaseImage from '@/components/ui/image/BaseImage'

import imageGalleryStyles from './ImageGallery.module.scss'

// With a `urlParam` the open photo lives in the URL as a 1-based number, so it can be shared and Back closes it
const ImageGallery = ({ title, urls, urlParam }) => {
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
					onOpen={() => goTo(position, { replace: false })}
				/>
			))}
			<BaseDialog
				show={isOpen}
				title={`${title}'s photos`}
				sectionClasses
				onClose={close}>
				{isOpen && (
					<div className={imageGalleryStyles.viewer}>
						<button
							type="button"
							className={imageGalleryStyles.nav}
							aria-label="Previous photo"
							disabled={!hasPrevious}
							onClick={showPrevious}
							data-cy={IMAGE.PREVIOUS}>
							&#8249;
						</button>
						<figure className={imageGalleryStyles.figure}>
							{failed.has(urls[index]) ? (
								<span
									className={imageGalleryStyles.fallback}
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
							className={imageGalleryStyles.nav}
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
	urlParam: PropTypes.string,
}

export default ImageGallery
