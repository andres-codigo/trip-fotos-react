import Button from '../../button/Button';
import buttonStyles from '../../button/Button.module.scss';
import PropTypes from 'prop-types';

function MessagesButton({ totalMessages }) {
	return (
		<li className="navMenuItemMessages" data-cy="nav-menu-item-messages">
			<Button isLink to="/" className="navLink">
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<span className={buttonStyles.totalMessagesContainer}>
						<span
							className={buttonStyles.totalMessages}
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
