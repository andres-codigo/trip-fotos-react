import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

const BaseCard = ({ className, children }) => {
	const combinedClassName = cn(
		'mx-auto max-w-160 rounded-lg p-4 shadow-elevated',
		className,
	)

	return (
		<div
			className={combinedClassName}
			data-cy="base-card">
			{children}
		</div>
	)
}

BaseCard.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
}

export default BaseCard
