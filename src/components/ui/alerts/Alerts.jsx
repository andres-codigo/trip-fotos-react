import { useState, useEffect, useCallback } from 'react'
import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import BaseButton from '@/components/ui/button/BaseButton'

const alertVariants = cva(
	'relative z-10 flex w-full items-center justify-between gap-4 rounded-sm px-6 py-4 text-primary-foreground [&_p]:m-0 [&_p]:font-medium',
	{
		variants: {
			type: {
				success: 'bg-alert-success',
				error: 'bg-destructive',
				info: 'bg-accent-foreground',
			},
			closing: {
				true: 'animate-alert-out',
				false: 'animate-alert-in',
			},
		},
		defaultVariants: { type: 'success', closing: false },
	},
)

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
			className={alertVariants({ type, closing: isClosing })}
			onAnimationEnd={handleAnimationEnd}
			role="alert">
			<p>{message}</p>
			<BaseButton
				onClick={handleClose}
				className="h-auto w-auto text-2xl leading-none opacity-80 hover:bg-transparent hover:font-bold hover:opacity-100 focus:font-bold focus:opacity-100 active:font-bold active:opacity-100"
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
