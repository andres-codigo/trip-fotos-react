import PropTypes from 'prop-types'

import './textarea.scss'

const Textarea = ({
	id,
	label,
	value,
	onChange,
	onBlur,
	rows = 3,
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
		<textarea
			id={id}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			rows={rows}
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

Textarea.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string,
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	rows: PropTypes.number,
	isValid: PropTypes.bool,
	message: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	showRequiredMark: PropTypes.bool,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
	'data-cy-error': PropTypes.string,
}

export default Textarea
