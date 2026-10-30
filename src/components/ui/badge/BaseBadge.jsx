import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import { BADGE } from '@/constants/test'

import { getToneIndex } from '@/utils/getToneIndex'

const badgeVariants = cva(
	'inline-block select-none rounded-pill px-6 py-2 uppercase max-[768px]:px-3',
	{
		variants: {
			tone: {
				none: 'bg-muted text-card-foreground',
				0: 'bg-badge-0 text-primary-foreground',
				1: 'bg-badge-1 text-primary-foreground',
				2: 'bg-badge-2 text-primary-foreground',
				3: 'bg-badge-3 text-primary-foreground',
				4: 'bg-badge-4 text-primary-foreground',
				5: 'bg-badge-5 text-primary-foreground',
				6: 'bg-badge-6 text-primary-foreground',
				7: 'bg-badge-7 text-primary-foreground',
			},
		},
		defaultVariants: { tone: 'none' },
	},
)

const BaseBadge = ({ type, title }) => (
	<span
		className={badgeVariants({ tone: type ? getToneIndex(type) : 'none' })}
		data-cy={BADGE.ID}>
		{title}
	</span>
)

BaseBadge.propTypes = {
	type: PropTypes.string,
	title: PropTypes.string.isRequired,
}

export default BaseBadge
