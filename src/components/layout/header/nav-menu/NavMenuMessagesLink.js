import classNames from 'classnames';
import PropTypes from 'prop-types';

import NavMenuButtonLink from './NavMenuButtonLink.js';

import navMenuButtonLinkStyles from './NavMenuButtonLink.module.scss';

function NavMenuMessagesLink({ totalMessages, to, className }) {
	const combinedClassName = classNames(className, navMenuButtonLinkStyles);

	return (
		<li className="navMenuItemMessages" data-cy="nav-menu-item-messages">
			<NavMenuButtonLink isLink to={to} className={combinedClassName}>
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<span
						className={
							navMenuButtonLinkStyles.totalMessagesContainer
						}>
						<span
							className={navMenuButtonLinkStyles.totalMessages}
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
	to: PropTypes.string,
	className: PropTypes.string,
};

export default NavMenuMessagesLink;
