import PropTypes from 'prop-types'

import { ACCESSIBILITY } from '@/constants/ui'

const LoadingAnnouncement = ({ isLoading }) => (
	<div
		aria-live="polite"
		style={ACCESSIBILITY.ARIA_LIVE.POLITE.STYLE}>
		{isLoading ? ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE : ''}
	</div>
)

LoadingAnnouncement.propTypes = {
	isLoading: PropTypes.bool,
}

export default LoadingAnnouncement
