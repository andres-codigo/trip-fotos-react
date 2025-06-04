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
	dataCypress,
	dataCypressError,
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
			data-cy={dataCypress}
			disabled={disabled}
			required={required}
			className={className}
			{...props}
		/>
		{!isValid && message && <p data-cy={dataCypressError}>{message}</p>}
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
	dataCypress: PropTypes.string,
	dataCypressError: PropTypes.string,
	className: PropTypes.string,
}

export default Input
