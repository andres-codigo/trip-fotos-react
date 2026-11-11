import PropTypes from 'prop-types'

import { MESSAGES_CONFIG } from '@/constants/travellers'
import { NAVIGATION } from '@/constants/ui'

import NavMenuButtonLink from './NavMenuButtonLink'

const NavMenuMessagesLink = ({
	to,
	unreadMessages = 0,
	isActive = false,
	'data-cy': dataCy,
}) => (
	<li className="flex">
		<NavMenuButtonLink
			to={to}
			isActive={isActive}
			ariaLabel={MESSAGES_CONFIG.NAV_LABEL(unreadMessages)}
			data-cy={dataCy}>
			{NAVIGATION.MESSAGES}
			{unreadMessages > 0 && (
				<>
					{/* Spaced so the visible text reads "Messages 3", part of the accessible name */}{' '}
					<span
						className="inline-flex h-[1.375rem] min-w-[1.375rem] animate-badge-in items-center justify-center rounded-pill bg-accent px-1.5 text-xs font-bold text-on-accent"
						data-cy="total-messages">
						{unreadMessages}
					</span>
				</>
			)}
		</NavMenuButtonLink>
	</li>
)

NavMenuMessagesLink.propTypes = {
	to: PropTypes.string.isRequired,
	unreadMessages: PropTypes.number,
	isActive: PropTypes.bool,
	'data-cy': PropTypes.string,
}

export default NavMenuMessagesLink
