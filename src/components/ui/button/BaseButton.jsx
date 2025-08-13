import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import classNames from 'classnames'
import PropTypes from 'prop-types'

import baseButtonStyles from './BaseButton.module.scss'

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

	const combinedClassName = classNames(className, baseButtonStyles[modeType])

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
