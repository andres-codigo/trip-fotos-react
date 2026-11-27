import PropTypes from 'prop-types'

import { GLOBAL } from '@/constants/ui'
import { cn } from '@/utils/cn'

import SpinnerIcon from '@/components/ui/spinner/SpinnerIcon'

// Turns, or shows brightening dots in place of the ring under reduced motion, so loading never looks frozen; the label is always visible
const BaseSpinner = ({ label = GLOBAL.SPINNER_LABEL.DEFAULT, className }) => {
	return (
		<div
			className={cn(
				'flex h-full w-full items-center justify-center gap-3 text-text-muted',
				className,
			)}
			data-cy="base-spinner"
			role="status"
			aria-live="polite"
			aria-busy="true">
			<SpinnerIcon data-cy="base-spinner-icon" />
			<span data-cy="base-spinner-label">{label}</span>
		</div>
	)
}

BaseSpinner.propTypes = {
	label: PropTypes.string,
	className: PropTypes.string,
}

export default BaseSpinner
