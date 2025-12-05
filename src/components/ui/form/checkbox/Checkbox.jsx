import PropTypes from 'prop-types'
import classNames from 'classnames'

import './checkbox.scss'

const Checkbox = ({
	id,
	label,
	checked,
	onChange,
	value,
	disabled = false,
	required = false,
	className = '',
	isValid = true,
	message = '',
	'data-cy': dataCy,
	'data-cy-error': dataCyError,
	...rest
}) => {
	const containerClass = classNames('checkbox-container', className)

	return (
		<div className={containerClass}>
			<input
				id={id}
				type="checkbox"
				checked={checked}
				onChange={onChange}
				value={value}
				disabled={disabled}
				required={required}
				data-cy={dataCy}
				aria-required={required}
				aria-invalid={!isValid}
				aria-describedby={
					!isValid && message ? `${id}-error` : undefined
				}
				{...rest}
			/>
			{label && (
				<label htmlFor={id}>
					{label}
					{required && <span className="input-required">*</span>}
				</label>
			)}
			{!isValid && message && (
				<p
					id={`${id}-error`}
					role="alert"
					data-cy-error={dataCyError}
					className="checkbox-error">
					{message}
				</p>
			)}
		</div>
	)
}

Checkbox.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	checked: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	className: PropTypes.string,
	isValid: PropTypes.bool,
	message: PropTypes.string,
	'data-cy': PropTypes.string,
	'data-cy-error': PropTypes.string,
}

export default Checkbox
