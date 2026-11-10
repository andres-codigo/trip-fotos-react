import PropTypes from 'prop-types'

import { GLOBAL } from '@/constants/ui'

// Turns, or pulses under reduced motion so loading never looks frozen; the label is always visible
const BaseSpinner = ({ label = GLOBAL.SPINNER_LABEL.DEFAULT }) => {
	return (
		<div
			className="flex h-full w-full items-center justify-center gap-3 text-text-muted"
			data-cy="base-spinner"
			role="status"
			aria-live="polite"
			aria-busy="true">
			<span
				className="size-6 flex-none animate-spin rounded-full border-3 border-solid border-accent-text border-r-transparent motion-reduce:animate-skeleton"
				aria-hidden="true"
				data-cy="base-spinner-icon"
			/>
			<span data-cy="base-spinner-label">{label}</span>
		</div>
	)
}

BaseSpinner.propTypes = {
	label: PropTypes.string,
}

export default BaseSpinner
