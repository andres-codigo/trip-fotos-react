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
	dataCypress,
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
					data-cy={dataCypress}
					disabled={isDisabled}
					{...(typeof children !== 'string'
						? { 'aria-label': props['ariaLabel'] || 'Button' }
						: {})}
					{...props}>
					{children}
				</button>
			) : (
				<Link
					to={isDisabled ? undefined : to}
					ref={elementRef}
					className={combinedClassName}
					data-cy={dataCypress}
					aria-disabled={isDisabled}
					tabIndex={isDisabled ? -1 : undefined}
					{...(typeof children !== 'string'
						? { 'aria-label': props['ariaLabel'] || 'Link' }
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
	dataCypress: PropTypes.string,
	ariaLabel: PropTypes.string,
}

export default BaseButton
