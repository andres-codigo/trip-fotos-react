import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

const RING_CLASSES = {
	md: 'size-6 animate-spin rounded-full border-3 border-solid border-accent-text border-r-transparent',
	sm: 'size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
}

const DOTS_CLASSES = {
	md: 'h-6 gap-1',
	sm: 'h-4 gap-[3px]',
}

const DOT_CLASSES = {
	md: 'size-1.5 bg-accent-text',
	sm: 'size-1 bg-current',
}

const DOT_DELAYS = ['', '[animation-delay:0.2s]', '[animation-delay:0.4s]']

// Dots replace the ring under reduced motion: a pulsing ring reads as broken
const SpinnerIcon = ({ size = 'md', className, ...props }) => {
	return (
		<span
			aria-hidden="true"
			className={cn('inline-flex flex-none items-center', className)}
			{...props}>
			<span className={cn(RING_CLASSES[size], 'motion-reduce:hidden')} />
			<span
				className={cn(
					'hidden items-center motion-reduce:inline-flex',
					DOTS_CLASSES[size],
				)}>
				{DOT_DELAYS.map((delay) => (
					<span
						key={delay || 'first'}
						className={cn(
							'animate-loading-dot rounded-full opacity-30',
							DOT_CLASSES[size],
							delay,
						)}
					/>
				))}
			</span>
		</span>
	)
}

SpinnerIcon.propTypes = {
	size: PropTypes.oneOf(['md', 'sm']),
	className: PropTypes.string,
}

export default SpinnerIcon
