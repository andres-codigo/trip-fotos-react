import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

const ICON_PATHS = Object.freeze({
	travellers: (
		<>
			<circle
				cx="9"
				cy="8"
				r="3.5"
			/>
			<path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
			<path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
			<path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
		</>
	),
	messages: (
		<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z" />
	),
	'my-trip': (
		<>
			<path d="M3 8a1 1 0 0 1 1-1h3.5l1.5-2.5h6L16.5 7H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
			<circle
				cx="12"
				cy="13"
				r="3.5"
			/>
		</>
	),
	register: <path d="M12 5v14M5 12h14" />,
})

function TabBarIcon({ name, className }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			className={cn('size-[1.375rem] shrink-0', className)}>
			{ICON_PATHS[name]}
		</svg>
	)
}

TabBarIcon.propTypes = {
	name: PropTypes.oneOf(['travellers', 'messages', 'my-trip', 'register'])
		.isRequired,
	className: PropTypes.string,
}

export default TabBarIcon
