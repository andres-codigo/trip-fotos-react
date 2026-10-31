import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

const ErrorMessage = ({ id, className, children, ...rest }) => (
	<p
		id={id}
		role="alert"
		className={cn('mt-1 text-destructive', className)}
		{...rest}>
		{children}
	</p>
)

ErrorMessage.propTypes = {
	id: PropTypes.string,
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
}

export default ErrorMessage
