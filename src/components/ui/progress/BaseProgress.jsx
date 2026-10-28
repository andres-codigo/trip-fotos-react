import PropTypes from 'prop-types'

import { PROGRESS } from '@/constants/test'

import baseProgressStyles from './BaseProgress.module.scss'

const BaseProgress = ({ value, label }) => (
	<div
		className={baseProgressStyles.progress}
		data-cy={PROGRESS.ID}>
		<progress
			className={baseProgressStyles.bar}
			value={value}
			max={100}
			aria-label={label}
			data-cy={PROGRESS.BAR}>
			{value}%
		</progress>
		<span
			className={baseProgressStyles.label}
			data-cy={PROGRESS.LABEL}>
			{label}
		</span>
	</div>
)

BaseProgress.propTypes = {
	value: PropTypes.number.isRequired,
	label: PropTypes.string.isRequired,
}

export default BaseProgress
