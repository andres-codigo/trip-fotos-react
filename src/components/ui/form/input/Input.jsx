import { useState } from 'react'
import PropTypes from 'prop-types'

import { INPUT } from '@/constants/test'
import { GLOBAL } from '@/constants/ui'

import ErrorMessage from '@/components/ui/error-message/ErrorMessage'

import { cn } from '@/utils/cn'

import {
	describedBy,
	fieldClasses,
	fieldErrorClasses,
	helpTextClasses,
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
	helpText = '',
	className = '',
	'data-cy': dataCy,
	'data-cy-error': dataCyError,
	...rest
}) => {
	const [isShown, setIsShown] = useState(false)
	const isPassword = type === 'password'
	const isDate = type === 'date'

	const field = (
		<input
			id={id}
			type={isPassword && isShown ? 'text' : type}
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			data-cy={dataCy}
			disabled={disabled}
			required={required}
			className={cn(
				fieldClasses,
				isPassword && 'pr-18',
				isDate && 'min-w-0 pr-8 own-date-button:pr-[0.15rem]',
				className,
			)}
			aria-required={required}
			aria-invalid={!isValid}
			aria-describedby={describedBy(id, helpText, !isValid && message)}
			{...rest}
		/>
	)

	return (
		<div>
			{label && (
				<label
					htmlFor={id}
					className={labelClasses}>
					{label}{' '}
					{(showRequiredMark || required) && (
						<span
							aria-hidden="true"
							className={requiredMarkClasses}>
							*
						</span>
					)}
				</label>
			)}
			{helpText && (
				<p
					id={`${id}-help`}
					className={helpTextClasses}>
					{helpText}
				</p>
			)}
			{!isValid && message && (
				<ErrorMessage
					id={`${id}-error`}
					className={fieldErrorClasses}
					hasIcon
					data-cy-error={dataCyError}>
					{message}
				</ErrorMessage>
			)}
			{isPassword ? (
				<div className="relative">
					{field}
					{/* The name changes with the state rather than using aria-pressed, so it always matches the visible word */}
					<button
						type="button"
						className="absolute top-1/2 right-1 min-h-9 -translate-y-1/2 cursor-pointer rounded-md border-0 bg-transparent px-2 font-medium text-accent-text hover:bg-surface-accent disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => setIsShown((shown) => !shown)}
						disabled={disabled}
						data-cy={INPUT.PASSWORD_TOGGLE}>
						{isShown
							? GLOBAL.PASSWORD_TOGGLE.HIDE
							: GLOBAL.PASSWORD_TOGGLE.SHOW}{' '}
						<span className="sr-only">
							{GLOBAL.PASSWORD_TOGGLE.FIELD}
						</span>
					</button>
				</div>
			) : isDate ? (
				// iOS draws no picker icon and Chrome its own, so they get this one; Chrome's stays on top, invisible, to open the picker. Firefox's cannot be hidden, so it keeps its own
				<div className="relative">
					{field}
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="pointer-events-none absolute top-1/2 right-2 size-[1.125rem] -translate-y-1/2 text-text-muted own-date-button:hidden">
						<rect
							x="3"
							y="5"
							width="18"
							height="16"
							rx="2"
						/>
						<path d="M16 3v4M8 3v4M3 10h18" />
					</svg>
				</div>
			) : (
				field
			)}
		</div>
	)
}

Input.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.node,
	type: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	onChange: PropTypes.func.isRequired,
	onBlur: PropTypes.func,
	isValid: PropTypes.bool,
	message: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	showRequiredMark: PropTypes.bool,
	helpText: PropTypes.string,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
	'data-cy-error': PropTypes.string,
}

export default Input
