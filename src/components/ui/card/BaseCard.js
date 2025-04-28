import PropTypes from 'prop-types';

import baseCardStyles from './BaseCard.module.scss';

function BaseCard({ children }) {
	return <div className={baseCardStyles.card}>{children}</div>;
}

BaseCard.propTypes = {
	children: PropTypes.node.isRequired,
};

export default BaseCard;
