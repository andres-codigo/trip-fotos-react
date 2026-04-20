import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import BaseButton from '@/components/ui/button/BaseButton'

import styles from './Alerts.module.scss'

const Alerts = ({ message, type = 'success', duration = 5000, onClose }) => {
	const [isVisible, setIsVisible] = useState(true)
	const [isClosing, setIsClosing] = useState(false)

	const handleClose = useCallback(() => {
		if (isClosing) return

		setIsClosing(true)
	}, [isClosing])

	const handleAnimationEnd = useCallback(
		(event) => {
			if (!isClosing || event.currentTarget !== event.target) return

			setIsVisible(false)
			if (onClose) onClose()
		},
		[isClosing, onClose],
	)

	useEffect(() => {
		if (!duration) return undefined

		const timer = setTimeout(() => {
			handleClose()
		}, duration)

		return () => clearTimeout(timer)
	}, [duration, handleClose])

	if (!isVisible) return null

	return (
		<div
			className={`${styles.container} ${styles[type]} ${isClosing ? styles.fadeOut : ''}`}
			onAnimationEnd={handleAnimationEnd}
			role="alert">
			<p>{message}</p>
			<BaseButton
				onClick={handleClose}
				className={styles.closeButton}
				aria-label="Close message"
				modeType="text">
				&times;
			</BaseButton>
		</div>
	)
}

Alerts.propTypes = {
	message: PropTypes.string.isRequired,
	type: PropTypes.oneOf(['success', 'error', 'info']),
	duration: PropTypes.number,
	onClose: PropTypes.func,
}

export default Alerts
