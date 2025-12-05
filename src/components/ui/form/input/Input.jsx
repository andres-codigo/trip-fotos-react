import PropTypes from 'prop-types'
import classNames from 'classnames'

import './input.scss'

const Input = ({
	id,
	label,
	type = 'text',
	value,
	checked,
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
}) => {
	const isCheckbox = type === 'checkbox'
	const containerClass = classNames({
		'checkbox-container': isCheckbox,
	})

	const inputElement = (
		<input
			id={id}
			type={type}
			value={value}
			checked={checked}
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
	)

	const labelElement = label && (
		<label htmlFor={id}>
			{label + ' '}
			{(showRequiredMark || required) && (
				<span className="input-required">*</span>
			)}
		</label>
	)

	return (
		<div className={containerClass}>
			{isCheckbox ? (
				<>
					{inputElement}
					{labelElement}
				</>
			) : (
				<>
					{labelElement}
					{inputElement}
				</>
			)}
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
}

Input.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	checked: PropTypes.bool,
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
