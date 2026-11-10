import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import { BADGE } from '@/constants/test'

import { getToneIndex } from '@/utils/getToneIndex'

const badgeVariants = cva(
	'inline-block rounded-pill px-6 py-2 uppercase select-none [@media(max-width:768px)]:px-3',
	{
		variants: {
			tone: {
				none: 'bg-surface-sunken text-text',
				0: 'bg-badge-0 text-on-badge',
				1: 'bg-badge-1 text-on-badge',
				2: 'bg-badge-2 text-on-badge',
				3: 'bg-badge-3 text-on-badge',
				4: 'bg-badge-4 text-on-badge',
				5: 'bg-badge-5 text-on-badge',
				6: 'bg-badge-6 text-on-badge',
				7: 'bg-badge-7 text-on-badge',
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
