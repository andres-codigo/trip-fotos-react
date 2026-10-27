import PropTypes from 'prop-types'

import NavMenuButtonLink from './NavMenuButtonLink'

import navMenuButtonLinkStyles from './NavMenuButtonLink.module.scss'

const NavMenuMessagesLink = ({
	isLink,
	to,
	totalMessages,
	onMenuItemClick,
	className,
	'data-cy': dataCy,
}) => {
	return (
		<li className="navMenuItemMessages">
			<NavMenuButtonLink
				isLink={isLink}
				to={to}
				onMenuItemClick={onMenuItemClick}
				className={className}
				ariaLabel={
					totalMessages > 0 ? `Messages ${totalMessages}` : 'Messages'
				}
				data-cy={dataCy}>
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<>
						{' '}
						<span
							className={
								navMenuButtonLinkStyles.totalMessagesContainer
							}>
							<span
								className={
									navMenuButtonLinkStyles.totalMessages
								}
								data-cy="total-messages">
								{totalMessages}
							</span>
						</span>
					</>
				)}
			</NavMenuButtonLink>
		</li>
	)
}
NavMenuMessagesLink.propTypes = {
	isLink: PropTypes.bool,
	to: PropTypes.string,
	totalMessages: PropTypes.number,
	onMenuItemClick: PropTypes.func,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default NavMenuMessagesLink
