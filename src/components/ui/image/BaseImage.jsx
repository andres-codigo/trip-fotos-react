import { useState } from 'react'
import PropTypes from 'prop-types'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

const PLACEHOLDER_DIMENSIONS = { width: 4, height: 3 }

const BaseImage = ({ title, url, dimensions, onOpen }) => {
	const [hasError, setHasError] = useState(false)

	const alt = `${title}'s photo`
	const { width, height } = dimensions ?? PLACEHOLDER_DIMENSIONS

	return (
		<li
			className="relative w-[48%] overflow-hidden min-[481px]:w-[32%] [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:cursor-pointer [&_img]:object-scale-down"
			data-cy={IMAGE.ID}>
			{/* Nothing to enlarge, so the fallback is not a button */}
			{hasError ? (
				<span
					className="block p-4 text-center text-card-foreground"
					role="img"
					aria-label={`${alt} is unavailable`}
					data-cy={IMAGE.FALLBACK}>
					{GLOBAL.IMAGE_UNAVAILABLE}
				</span>
			) : (
				<button
					type="button"
					className="block w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
					aria-label={`View ${title}'s photo`}
					onClick={onOpen}
					data-cy={IMAGE.BUTTON}>
					<img
						src={url}
						alt={alt}
						width={width}
						height={height}
						loading="lazy"
						onError={() => setHasError(true)}
						data-cy={IMAGE.THUMBNAIL}
					/>
				</button>
			)}
		</li>
	)
}

BaseImage.propTypes = {
	title: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
	dimensions: PropTypes.shape({
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
	}),
	onOpen: PropTypes.func.isRequired,
}

export default BaseImage
