import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import { BADGE } from '@/constants/test'

import { getToneIndex } from '@/utils/getToneIndex'

const badgeVariants = cva(
	'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-sm select-none',
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
		{/* A pin marks it as a place, so it reads as a label rather than a button */}
		<svg
			aria-hidden="true"
			focusable="false"
			className="size-3.5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round">
			<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
			<circle
				cx="12"
				cy="9.5"
				r="2.5"
			/>
		</svg>
		{title}
	</span>
)

BaseBadge.propTypes = {
	type: PropTypes.string,
	title: PropTypes.string.isRequired,
}

export default BaseBadge
