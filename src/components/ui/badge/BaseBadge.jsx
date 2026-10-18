import PropTypes from 'prop-types'

import { BADGE } from '@/constants/test'

import baseBadgeStyles from './BaseBadge.module.scss'

const BaseBadge = ({ type, title }) => {
	const classNames = [baseBadgeStyles.badge, baseBadgeStyles[type]]
		.filter(Boolean)
		.join(' ')

	return (
		<span
			className={classNames}
			data-cy={BADGE.ID}>
			{title}
		</span>
	)
}

BaseBadge.propTypes = {
	type: PropTypes.string,
	title: PropTypes.string.isRequired,
}

export default BaseBadge
