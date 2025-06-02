import PropTypes from 'prop-types'

const Input = ({
	id,
	label,
	type = 'text',
	value,
	onChange,
	onBlur,
	isValid = true,
	message = '',
	disabled = false,
	dataCyInput,
	dataCyErrorMessage,
	className = '',
	...props
}) => (
	<div className={className}>
		{label && <label htmlFor={id}>{label}</label>}
		<input
			id={id}
			type={type}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			data-cy={dataCyInput}
			disabled={disabled}
			{...props}
		/>
		{!isValid && message && (
			<p data-cy={`${dataCyErrorMessage}-error-message`}>{message}</p>
		)}
	</div>
)

Input.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	isValid: PropTypes.bool,
	message: PropTypes.string,
	disabled: PropTypes.bool,
	dataCyInput: PropTypes.string,
	dataCyErrorMessage: PropTypes.string,
	className: PropTypes.string,
}

export default Input
