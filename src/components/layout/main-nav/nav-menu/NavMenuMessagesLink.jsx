import PropTypes from 'prop-types'

import NavMenuButtonLink from './NavMenuButtonLink'

const NavMenuMessagesLink = ({
	isLink,
	to,
	totalMessages,
	onMenuItemClick,
	isActive,
	className,
	'data-cy': dataCy,
}) => {
	return (
		<li>
			<NavMenuButtonLink
				isLink={isLink}
				to={to}
				onMenuItemClick={onMenuItemClick}
				isActive={isActive}
				className={className}
				ariaLabel={
					totalMessages > 0 ? `Messages ${totalMessages}` : 'Messages'
				}
				data-cy={dataCy}>
				Messages
				{!!totalMessages && totalMessages > 0 && (
					<>
						{' '}
						<span className="absolute top-0 size-[1.4rem] animate-badge-in border border-solid border-primary leading-[1.4rem] mobile:size-8 mobile:rounded-pill mobile:border-none mobile:leading-8">
							<span
								className="relative inline-block w-full text-center text-xs mobile:bottom-px mobile:text-base"
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
	isActive: PropTypes.bool,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default NavMenuMessagesLink
