import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { cva } from 'class-variance-authority'
import PropTypes from 'prop-types'

import { cn } from '@/utils/cn'

const buttonVariants = cva('border border-solid', {
	variants: {
		shape: {
			button: 'inline-flex cursor-pointer items-center justify-center rounded-pill px-6 py-3 font-[family-name:inherit] text-[length:inherit] leading-tight font-[weight:inherit] no-underline',
			link: 'inline-block border-transparent hover:text-accent-hover active:text-accent-hover',
		},
		mode: {
			primary:
				'border-accent bg-accent text-on-accent hover:border-accent-hover hover:bg-accent-hover active:border-accent-hover active:bg-accent-hover',
			flat: 'border-transparent bg-transparent text-accent-text hover:bg-surface-accent active:bg-surface-accent',
			danger: 'border-danger bg-danger text-on-danger hover:border-danger-hover hover:bg-danger-hover active:border-danger-hover active:bg-danger-hover',
			text: 'border-none bg-transparent p-0 text-inherit hover:bg-transparent active:bg-transparent',
			outline:
				'border-accent-text bg-transparent text-accent-text hover:bg-surface-accent active:bg-surface-accent',
		},
		disabled: {
			true: 'cursor-default border-border-strong bg-surface-sunken text-text-muted hover:bg-surface-sunken active:bg-surface-sunken',
			false: '',
		},
	},
	defaultVariants: { mode: 'primary', shape: 'button', disabled: false },
})

const MODES = ['primary', 'flat', 'danger', 'text', 'outline']

// An unknown or legacy modeType (e.g. 'outlined') keeps the primary look
const resolveMode = (modeType) =>
	MODES.includes(modeType) ? modeType : 'primary'

const BaseButton = ({
	children,
	isLink = false,
	isError = false,
	isDisabled = false,
	modeType,
	to = '/',
	className,
	'data-cy': dataCy,
	ariaLabel,
	...props
}) => {
	const elementRef = useRef()

	useEffect(() => {
		if (isError && elementRef.current) {
			elementRef.current.focus()
		}
	}, [isError])

	const isButtonStyled = !isLink || Boolean(modeType)

	const combinedClassName = cn(
		buttonVariants({
			mode: isButtonStyled ? resolveMode(modeType) : null,
			shape: isButtonStyled ? 'button' : 'link',
			disabled: isButtonStyled && isDisabled,
		}),
		className,
	)

	return (
		<>
			{!isLink ? (
				<button
					ref={elementRef}
					className={combinedClassName}
					data-cy={dataCy}
					disabled={isDisabled}
					{...(typeof children !== 'string'
						? { 'aria-label': ariaLabel || 'Button' }
						: {})}
					{...props}>
					{children}
				</button>
			) : isDisabled ? (
				<span
					ref={elementRef}
					className={combinedClassName}
					data-cy={dataCy}
					aria-disabled="true"
					tabIndex={-1}
					{...(typeof children !== 'string'
						? { 'aria-label': ariaLabel || 'Link' }
						: {})}
					{...props}>
					{children}
				</span>
			) : (
				<Link
					to={to}
					ref={elementRef}
					className={combinedClassName}
					data-cy={dataCy}
					{...(typeof children !== 'string'
						? { 'aria-label': ariaLabel || 'Link' }
						: {})}
					{...props}>
					{children}
				</Link>
			)}
		</>
	)
}

BaseButton.propTypes = {
	children: PropTypes.node.isRequired,
	isLink: PropTypes.bool,
	isError: PropTypes.bool,
	isDisabled: PropTypes.bool,
	modeType: PropTypes.string,
	to: PropTypes.string,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
	ariaLabel: PropTypes.string,
}

export default BaseButton
