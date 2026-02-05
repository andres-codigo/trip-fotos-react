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
	isArrayItem = false,
	showRequiredMark = false,
	className = '',
	isValid = true,
	message = '',
	'data-cy': dataCy,
	'data-cy-error': dataCyError,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledby,
	'data-testid': dataTestid,
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
				data-testid={dataTestid}
				aria-required={required}
				aria-invalid={!isValid}
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledby}
				aria-describedby={
					!isValid && message ? `${id}-error` : undefined
				}
			/>
			{label && (
				<label htmlFor={id}>
					{label}
					{!isArrayItem && (showRequiredMark || required) && (
						<span className="input-required">*</span>
					)}
				</label>
			)}
			{!isArrayItem && !isValid && message && (
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
	showRequiredMark: PropTypes.bool,
	'data-cy': PropTypes.string,
	'data-cy-error': PropTypes.string,
	'aria-label': PropTypes.string,
	'aria-labelledby': PropTypes.string,
	'data-testid': PropTypes.string,
	isArrayItem: PropTypes.bool,
}

export default Checkbox
