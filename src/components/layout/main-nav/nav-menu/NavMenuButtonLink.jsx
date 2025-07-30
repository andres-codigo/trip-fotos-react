import { useEffect, useRef } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import BaseButton from '@/components/ui/button/BaseButton'

import navMenuButtonLinkStyles from './NavMenuButtonLink.module.scss'

const NavMenuButtonLink = ({
	children,
	isLink = false,
	isError = false,
	isDisabled = false,
	modeType,
	to = '/',
	className,
	onMenuItemClick,
	'data-cy': dataCy,
	...props
}) => {
	const elementRef = useRef()

	useEffect(() => {
		if (isError && elementRef.current) {
			elementRef.current.focus()
		}
	}, [isError])

	const handleClick = (event) => {
		if (
			isLink &&
			onMenuItemClick &&
			document.documentElement.clientWidth <= 768
		) {
			onMenuItemClick()
		}

		if (props.onClick) {
			props.onClick(event)
		}
	}

	const combinedClassName = classNames(
		className,
		navMenuButtonLinkStyles[modeType],
	)

	return (
		<BaseButton
			ref={elementRef}
			className={combinedClassName}
			isLink={isLink}
			to={to}
			isError={isError}
			isDisabled={isDisabled}
			onClick={handleClick}
			data-cy={dataCy}
			{...props}>
			{children}
		</BaseButton>
	)
}

NavMenuButtonLink.propTypes = {
	children: PropTypes.node.isRequired,
	isLink: PropTypes.bool,
	isError: PropTypes.bool,
	isDisabled: PropTypes.bool,
	modeType: PropTypes.string,
	to: PropTypes.string,
	className: PropTypes.string,
	onMenuItemClick: PropTypes.func,
	onClick: PropTypes.func,
	'data-cy': PropTypes.string,
}

export default NavMenuButtonLink
