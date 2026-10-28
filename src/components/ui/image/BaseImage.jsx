import { useState } from 'react'
import PropTypes from 'prop-types'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import baseImageStyles from './BaseImage.module.scss'

const BaseImage = ({ title, url, onOpen }) => {
	const [hasError, setHasError] = useState(false)

	const alt = `${title}'s photo`

	return (
		<li
			className={baseImageStyles['image-preview']}
			data-cy={IMAGE.ID}>
			{/* Nothing to enlarge, so the fallback is not a button */}
			{hasError ? (
				<span
					className={baseImageStyles.fallback}
					role="img"
					aria-label={`${alt} is unavailable`}
					data-cy={IMAGE.FALLBACK}>
					{GLOBAL.IMAGE_UNAVAILABLE}
				</span>
			) : (
				<button
					type="button"
					className={baseImageStyles.trigger}
					aria-label={`View ${title}'s photo`}
					onClick={onOpen}
					data-cy={IMAGE.BUTTON}>
					<img
						src={url}
						alt={alt}
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
	onOpen: PropTypes.func.isRequired,
}

export default BaseImage
