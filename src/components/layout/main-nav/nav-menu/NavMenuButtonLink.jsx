import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

// The current page gets a 3px bar under the label, never colour alone; the ring sits inside so it clears the header edge
const linkClasses =
	'relative flex h-full items-center gap-2 px-4 text-[0.9375rem] font-medium text-on-header no-underline hover:bg-surface-accent focus-visible:-outline-offset-3'
const activeClasses =
	'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-[3px] after:bg-accent-text'

const NavMenuButtonLink = ({
	children,
	to,
	isActive = false,
	ariaLabel,
	className,
	'data-cy': dataCy,
}) => (
	<Link
		to={to}
		className={cn(linkClasses, isActive && activeClasses, className)}
		aria-current={isActive ? 'page' : undefined}
		aria-label={ariaLabel}
		data-cy={dataCy}>
		{children}
	</Link>
)

NavMenuButtonLink.propTypes = {
	children: PropTypes.node.isRequired,
	to: PropTypes.string.isRequired,
	isActive: PropTypes.bool,
	ariaLabel: PropTypes.string,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
}

export default NavMenuButtonLink
