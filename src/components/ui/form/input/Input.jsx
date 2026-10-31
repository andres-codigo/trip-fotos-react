import PropTypes from 'prop-types'

import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

import { cn } from '@/utils/cn'

import {
	fieldClasses,
	labelClasses,
	requiredMarkClasses,
} from '@/components/ui/form/fieldClasses'

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
			<label
				htmlFor={id}
				className={labelClasses}>
				{label + ' '}
				{(showRequiredMark || required) && (
					<span className={requiredMarkClasses}>*</span>
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
			className={cn(fieldClasses, className)}
			aria-required={required}
			aria-invalid={!isValid}
			aria-describedby={!isValid && message ? `${id}-error` : undefined}
			{...rest}
		/>
		{!isValid && message && (
			<ErrorMessage
				id={`${id}-error`}
				data-cy-error={dataCyError}>
				{message}
			</ErrorMessage>
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
