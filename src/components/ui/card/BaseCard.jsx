import PropTypes from 'prop-types'

import baseCardStyles from './BaseCard.module.scss'

const BaseCard = ({ children }) => {
	return <div className={baseCardStyles.card}>{children}</div>
}

BaseCard.propTypes = {
	children: PropTypes.node.isRequired,
}

export default BaseCard
