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
	showRequiredMark = false,
	className = '',
	'data-cy': dataCy,
	'data-cy-error': dataCyError,
	...rest
}) => (
	<div>
		{label && (
			<label htmlFor={id}>
				{label + ' '}
				{(showRequiredMark || required) && (
					<span className="input-required">*</span>
				)}
			</label>
		)}
		<input
			id={id}
			type={type}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			data-cy={dataCy}
			disabled={disabled}
			required={required}
			className={className}
			aria-required={required}
			aria-invalid={!isValid}
			aria-describedby={!isValid && message ? `${id}-error` : undefined}
			{...rest}
		/>
		{!isValid && message && (
			<p
				id={`${id}-error`}
				role="alert"
				data-cy-error={dataCyError}>
				{message}
			</p>
		)}
	</div>
)

Input.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	onChange: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	isValid: PropTypes.bool,
	message: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	showRequiredMark: PropTypes.bool,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
	'data-cy-error': PropTypes.string,
}

export default Input
