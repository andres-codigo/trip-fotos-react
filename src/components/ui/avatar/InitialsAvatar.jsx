import PropTypes from 'prop-types'

import { AVATAR } from '@/constants/test'

import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/getInitials'

// Decorative: the name it stands for is always shown beside it
function InitialsAvatar({ name, className }) {
	return (
		<span
			aria-hidden="true"
			data-cy={AVATAR.ROOT}
			className={cn(
				'flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-accent text-[0.9375rem] leading-none font-bold text-accent-text select-none',
				className,
			)}>
			{getInitials(name)}
		</span>
	)
}

InitialsAvatar.propTypes = {
	name: PropTypes.string.isRequired,
	className: PropTypes.string,
}

export default InitialsAvatar
