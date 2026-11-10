import PropTypes from 'prop-types'

import { MESSAGES_CONFIG } from '@/constants/travellers'

import NavMenuButtonLink from './NavMenuButtonLink'

const NavMenuMessagesLink = ({
	isLink,
	to,
	unreadMessages = 0,
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
				ariaLabel={MESSAGES_CONFIG.NAV_LABEL(unreadMessages)}
				data-cy={dataCy}>
				Messages
				{unreadMessages > 0 && (
					<>
						{' '}
						<span className="absolute top-0 size-[1.4rem] animate-badge-in border border-solid border-on-header leading-[1.4rem] mobile:size-8 mobile:rounded-pill mobile:border-none mobile:leading-8">
							<span
								className="relative inline-block w-full text-center text-xs mobile:bottom-px mobile:text-base"
								data-cy="total-messages">
								{unreadMessages}
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
	unreadMessages: PropTypes.number,
	onMenuItemClick: PropTypes.func,
	isActive: PropTypes.bool,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default NavMenuMessagesLink
