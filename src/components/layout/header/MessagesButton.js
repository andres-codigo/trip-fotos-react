import Button from '../../../components/ui/button/BaseButton.js';
import BaseButtonStyles from '../../../components/ui/button/BaseButton.module.scss';
import PropTypes from 'prop-types';

function MessagesButton({ totalMessages }) {
	return (
		<li className="navMenuItemMessages" data-cy="nav-menu-item-messages">
			<Button isLink to="/" className="navLink">
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<span className={BaseButtonStyles.totalMessagesContainer}>
						<span
							className={BaseButtonStyles.totalMessages}
							data-cy="total-messages">
							{totalMessages}
						</span>
					</span>
				)}
			</Button>
		</li>
	);
}
MessagesButton.propTypes = {
	totalMessages: PropTypes.number,
	onClick: PropTypes.func.isRequired,
};

export default MessagesButton;
