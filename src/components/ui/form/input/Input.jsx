import PropTypes from 'prop-types'

import './input.scss'

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
	required = false,
	dataCyInput,
	dataCyErrorMessage,
	className = '',
	...props
}) => (
	<div>
		{label && (
			<label htmlFor={id}>
				{label} {required && <span className="input-required">*</span>}
			</label>
		)}
		<input
			id={id}
			type={type}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			data-cy={dataCyInput}
			disabled={disabled}
			required={required}
			className={className}
			{...props}
		/>
		{!isValid && message && <p data-cy={dataCyErrorMessage}>{message}</p>}
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
	required: PropTypes.bool,
	dataCyInput: PropTypes.string,
	dataCyErrorMessage: PropTypes.string,
	className: PropTypes.string,
}

export default Input
