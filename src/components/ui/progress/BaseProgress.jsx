import PropTypes from 'prop-types'

import { PROGRESS } from '@/constants/test'

const BaseProgress = ({ value, label }) => (
	<div
		className="w-full"
		data-cy={PROGRESS.ID}>
		<progress
			className={
				'block h-3 w-full appearance-none overflow-hidden rounded-md border-0 bg-surface-sunken [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface-sunken [&::-webkit-progress-value]:bg-accent [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-200'
			}
			value={value}
			max={100}
			aria-label={label}
			data-cy={PROGRESS.BAR}>
			{value}%
		</progress>
		<span
			className={'mt-2 block text-center text-[0.875rem] text-text-muted'}
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
