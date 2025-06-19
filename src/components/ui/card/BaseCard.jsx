import classNames from 'classnames'
import PropTypes from 'prop-types'

import baseCardStyles from './BaseCard.module.scss'

const BaseCard = ({ className, children }) => {
	const combinedClassName = classNames(className, baseCardStyles.card)

	return (
		<div
			className={combinedClassName}
			data-cy="base-card">
			{children}
		</div>
	)
}

BaseCard.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
}

export default BaseCard
