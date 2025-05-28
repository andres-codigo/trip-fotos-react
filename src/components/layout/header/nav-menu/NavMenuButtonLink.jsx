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
	...props
}) => {
	const elementRef = useRef()

	useEffect(() => {
		if (isError && elementRef.current) {
			elementRef.current.focus()
		}
	}, [isError])

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
}

export default NavMenuButtonLink
