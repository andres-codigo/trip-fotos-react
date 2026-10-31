import PropTypes from 'prop-types'

const ErrorMessage = ({ id, className, children, ...rest }) => (
	<p
		id={id}
		role="alert"
		className={className}
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
