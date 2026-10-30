import PropTypes from 'prop-types'

import { PROGRESS } from '@/constants/test'

const BaseProgress = ({ value, label }) => (
	<div
		className={'mt-4 w-full'}
		data-cy={PROGRESS.ID}>
		<progress
			className={
				'block h-3 w-full appearance-none overflow-hidden rounded-md border-0 bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-200 [&::-moz-progress-bar]:bg-primary'
			}
			value={value}
			max={100}
			aria-label={label}
			data-cy={PROGRESS.BAR}>
			{value}%
		</progress>
		<span
			className={
				'mt-2 block text-center text-[0.875rem] text-card-foreground'
			}
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
