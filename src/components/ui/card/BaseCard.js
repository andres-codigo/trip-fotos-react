import PropTypes from 'prop-types';

import baseStyles from './BaseCard.module.scss';

function BaseCard({ children }) {
	return <div className={baseStyles.card}>{children}</div>;
}

BaseCard.propTypes = {
	children: PropTypes.node.isRequired,
};

export default BaseCard;
