import classNames from 'classnames'
import PropTypes from 'prop-types'

import NavMenuButtonLink from './NavMenuButtonLink'

import navMenuButtonLinkStyles from './NavMenuButtonLink.module.scss'

const NavMenuMessagesLink = ({
	isLink,
	to,
	totalMessages,
	className,
	dataCypress,
}) => {
	const combinedClassName = classNames(className, navMenuButtonLinkStyles)

	return (
		<li className="navMenuItemMessages">
			<NavMenuButtonLink
				isLink={isLink}
				to={to}
				className={combinedClassName}
				dataCypress={dataCypress}>
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
	)
}
NavMenuMessagesLink.propTypes = {
	isLink: PropTypes.bool,
	to: PropTypes.string,
	onClick: PropTypes.func.isRequired,
	totalMessages: PropTypes.number,
	className: PropTypes.string,
	dataCypress: PropTypes.string,
}

export default NavMenuMessagesLink
