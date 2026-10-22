import { useState } from 'react'
import PropTypes from 'prop-types'

import { IMAGE } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import BaseDialog from '@/components/ui/dialog/BaseDialog'

import baseImageStyles from './BaseImage.module.scss'

const getOrientation = ({ naturalWidth, naturalHeight }) => {
	if (naturalWidth > naturalHeight) return 'landscape'
	if (naturalWidth < naturalHeight) return 'portrait'
	return 'square'
}

const BaseImage = ({ title, url }) => {
	const [showDialog, setShowDialog] = useState(false)
	const [orientation, setOrientation] = useState('')
	const [hasError, setHasError] = useState(false)

	const toggleDialog = () => setShowDialog((prev) => !prev)
	const handleLoad = (event) => setOrientation(getOrientation(event.target))
	const handleError = () => setHasError(true)

	const alt = `${title}'s photo`

	const renderFallback = () => (
		<span
			className={baseImageStyles.fallback}
			role="img"
			aria-label={`${alt} is unavailable`}
			data-cy={IMAGE.FALLBACK}>
			{GLOBAL.IMAGE_UNAVAILABLE}
		</span>
	)

	return (
		<li
			className={baseImageStyles['image-preview']}
			data-cy={IMAGE.ID}>
			{/* Nothing to enlarge, so the fallback is not a button */}
			{hasError && !showDialog ? (
				renderFallback()
			) : (
				<button
					type="button"
					className={baseImageStyles.trigger}
					aria-label={`View ${title}'s photo`}
					onClick={toggleDialog}
					data-cy={IMAGE.BUTTON}>
					{hasError ? (
						renderFallback()
					) : (
						<img
							src={url}
							alt={alt}
							loading="lazy"
							onError={handleError}
							data-cy={IMAGE.THUMBNAIL}
						/>
					)}
				</button>
			)}
			<BaseDialog
				show={showDialog}
				title={`${title}'s photos`}
				sectionClasses
				onClose={toggleDialog}>
				<div className={baseImageStyles.image}>
					{hasError ? (
						renderFallback()
					) : (
						<img
							src={url}
							alt={alt}
							className={baseImageStyles[orientation]}
							onLoad={handleLoad}
							onError={handleError}
							data-cy={IMAGE.FULL}
						/>
					)}
				</div>
			</BaseDialog>
		</li>
	)
}

BaseImage.propTypes = {
	title: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
}

export default BaseImage
