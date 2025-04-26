import classNames from 'classnames';
import PropTypes from 'prop-types';

import NavMenuButtonLink from './NavMenuButtonLink.js';
import NavMenuButtonLinkStyles from './NavMenuButtonLink.module.scss';

function NavMenuMessagesLink({ totalMessages, className }) {
	const combinedClassName = classNames(className, NavMenuButtonLinkStyles);

	return (
		<li className="navMenuItemMessages" data-cy="nav-menu-item-messages">
			<NavMenuButtonLink isLink to="/" className={combinedClassName}>
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<span
						className={
							NavMenuButtonLinkStyles.totalMessagesContainer
						}>
						<span
							className={NavMenuButtonLinkStyles.totalMessages}
							data-cy="total-messages">
							{totalMessages}
						</span>
					</span>
				)}
			</NavMenuButtonLink>
		</li>
	);
}
NavMenuMessagesLink.propTypes = {
	totalMessages: PropTypes.number,
	onClick: PropTypes.func.isRequired,
	className: PropTypes.string,
};

export default NavMenuMessagesLink;
