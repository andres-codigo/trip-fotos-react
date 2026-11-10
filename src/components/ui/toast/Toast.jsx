import { useCallback, useEffect, useRef } from 'react'

import PropTypes from 'prop-types'

import { TOAST } from '@/constants/test'

import { cn } from '@/utils/cn'

const DismissIcon = () => (
	<svg
		aria-hidden="true"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
)

const Toast = ({
	message,
	actionLabel,
	onAction,
	onClose,
	duration = 8000,
	className,
	'data-cy': dataCy = TOAST.ROOT,
}) => {
	// Refs, not state, so a re-render never restarts or resets the countdown
	const timeoutRef = useRef(null)
	const startedAtRef = useRef(0)
	const remainingRef = useRef(duration)
	const isHoveredRef = useRef(false)
	const isFocusedRef = useRef(false)
	const isClosedRef = useRef(false)
	const onCloseRef = useRef(onClose)

	useEffect(() => {
		onCloseRef.current = onClose
	}, [onClose])

	const pause = useCallback(() => {
		if (timeoutRef.current === null) return
		clearTimeout(timeoutRef.current)
		timeoutRef.current = null
		remainingRef.current -= Date.now() - startedAtRef.current
	}, [])

	const resume = useCallback(() => {
		if (isClosedRef.current || timeoutRef.current !== null) return
		if (isHoveredRef.current || isFocusedRef.current) return
		startedAtRef.current = Date.now()
		timeoutRef.current = setTimeout(
			() => {
				timeoutRef.current = null
				isClosedRef.current = true
				onCloseRef.current()
			},
			Math.max(remainingRef.current, 0),
		)
	}, [])

	// Unmounting only stops the timer; the parent decides what unmounting means, so onClose is not called
	useEffect(() => {
		resume()
		return pause
	}, [pause, resume])

	const finish = (callback) => {
		if (isClosedRef.current) return
		pause()
		isClosedRef.current = true
		callback()
	}

	const handleFocus = () => {
		isFocusedRef.current = true
		pause()
	}

	const handleBlur = (e) => {
		// Moving focus between the toast's own buttons keeps it paused
		if (e.currentTarget.contains(e.relatedTarget)) return
		isFocusedRef.current = false
		resume()
	}

	const handlePointerEnter = () => {
		isHoveredRef.current = true
		pause()
	}

	const handlePointerLeave = () => {
		isHoveredRef.current = false
		resume()
	}

	const hasAction = Boolean(actionLabel && onAction)

	return (
		<div
			className={cn(
				'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2',
				className,
			)}
			data-cy={dataCy}>
			<div
				className="flex min-h-[3.25rem] items-center gap-1 rounded-[1.125rem] border border-border-card bg-surface py-1 pr-1 pl-4 text-text shadow-overlay transition-[opacity,translate] duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0"
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
				onFocus={handleFocus}
				onBlur={handleBlur}>
				<span
					role="status"
					className="flex-1"
					data-cy={TOAST.MESSAGE}>
					{message}
				</span>
				{hasAction && (
					<button
						type="button"
						className="min-h-11 cursor-pointer rounded-md border-0 bg-transparent px-4 font-medium text-accent-text underline underline-offset-4 hover:bg-surface-accent"
						onClick={() => finish(onAction)}
						data-cy={TOAST.ACTION}>
						{actionLabel}
					</button>
				)}
				<button
					type="button"
					aria-label="Dismiss"
					className="grid size-11 flex-none cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-text-muted hover:bg-surface-accent hover:text-text"
					onClick={() => finish(onCloseRef.current)}
					data-cy={TOAST.DISMISS}>
					<DismissIcon />
				</button>
			</div>
		</div>
	)
}

Toast.propTypes = {
	message: PropTypes.string.isRequired,
	actionLabel: PropTypes.string,
	onAction: PropTypes.func,
	onClose: PropTypes.func.isRequired,
	duration: PropTypes.number,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default Toast
