import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { TAB_BAR } from '@/constants/test'
import { MESSAGES_CONFIG } from '@/constants/travellers'
import { NAVIGATION } from '@/constants/ui'

import usePrimaryNavItems from '@/components/layout/main-nav/hooks/usePrimaryNavItems'

import { cn } from '@/utils/cn'

import TabBarIcon from './TabBarIcon'

const DATA_CY_BY_KEY = Object.freeze({
	travellers: TAB_BAR.TRAVELLERS,
	messages: TAB_BAR.MESSAGES,
	'my-trip': TAB_BAR.MY_TRIP,
	register: TAB_BAR.REGISTER,
})

function TabBar({ isTraveller, className }) {
	const isLoggedIn = useSelector((state) =>
		Boolean(state.authentication.token),
	)
	const items = usePrimaryNavItems({ isTraveller })

	if (!isLoggedIn) {
		return null
	}

	return (
		<>
			{/* Holds the bar's height in the page flow, so the footer scrolls clear of the fixed bar */}
			<div
				aria-hidden="true"
				className="hidden h-[calc(3.75rem+1px+env(safe-area-inset-bottom))] flex-none mobile:block"
				data-cy={TAB_BAR.SPACER}
			/>
			<nav
				aria-label={NAVIGATION.MAIN_LABEL}
				data-cy={TAB_BAR.ROOT}
				className={cn(
					'fixed inset-x-0 bottom-0 z-[1] hidden border-t border-border-card bg-surface pt-1 pr-[max(0.25rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] pl-[max(0.25rem,env(safe-area-inset-left))] shadow-overlay mobile:block',
					className,
				)}>
				<ul className="m-0 grid auto-cols-fr grid-flow-col p-0">
					{items.map(
						({ key, label, to, isActive, unreadMessages }) => {
							const hasUnread =
								key === 'messages' && unreadMessages > 0
							return (
								<li key={key}>
									<Link
										to={to}
										data-cy={DATA_CY_BY_KEY[key]}
										aria-current={
											isActive ? 'page' : undefined
										}
										className={cn(
											'relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-text-muted hover:bg-surface-accent focus-visible:-outline-offset-3',
											'aria-[current=page]:text-accent-text aria-[current=page]:before:absolute aria-[current=page]:before:top-0 aria-[current=page]:before:left-1/2 aria-[current=page]:before:h-[3px] aria-[current=page]:before:w-2/5 aria-[current=page]:before:-translate-x-1/2 aria-[current=page]:before:rounded-b-sm aria-[current=page]:before:bg-accent-text',
										)}>
										<span className="relative flex">
											<TabBarIcon name={key} />
											{hasUnread && (
												<span
													aria-hidden="true"
													data-cy={TAB_BAR.UNREAD}
													className="absolute -top-1.5 left-[calc(100%-0.625rem)] h-[1.125rem] min-w-[1.125rem] rounded-pill bg-accent px-1 text-center text-[0.6875rem] leading-[1.125rem] font-bold text-on-accent">
													{unreadMessages}
												</span>
											)}
										</span>
										<span className="text-xs leading-4 font-medium">
											{label}
											{/* The pill is hidden from the name, which then starts with the visible label */}
											{hasUnread && (
												<span className="sr-only">
													{`, ${MESSAGES_CONFIG.UNREAD_LABEL(unreadMessages)}`}
												</span>
											)}
										</span>
									</Link>
								</li>
							)
						},
					)}
				</ul>
			</nav>
		</>
	)
}

TabBar.propTypes = {
	isTraveller: PropTypes.bool,
	className: PropTypes.string,
}

export default TabBar
