import PropTypes from 'prop-types'

const ErrorMessage = ({
	id,
	className,
	hasIcon = false,
	children,
	...rest
}) => (
	<p
		id={id}
		role="alert"
		className={className}
		{...rest}>
		{hasIcon && (
			<span
				aria-hidden="true"
				className="mt-px inline-flex size-4.5 flex-none items-center justify-center rounded-full bg-danger-text text-xs font-bold text-surface">
				!
			</span>
		)}
		{children}
	</p>
)

ErrorMessage.propTypes = {
	id: PropTypes.string,
	className: PropTypes.string,
	hasIcon: PropTypes.bool,
	children: PropTypes.node.isRequired,
}

export default ErrorMessage
