import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import BaseButton from '@/components/ui/button/BaseButton'
import useViewport from '@/utils/useViewport'
import { cn } from '@/utils/cn'

// Links read as plain white text on the header; the current page gets an outline
const linkClasses =
	'relative text-primary-foreground hover:text-accent active:text-accent px-6 py-3 mobile:w-full mobile:px-0 mobile:py-5'
const activeClasses = 'border-primary-foreground hover:border-accent'

const NavMenuButtonLink = ({
	children,
	isLink = false,
	isError = false,
	isDisabled = false,
	modeType,
	isActive = false,
	to = '/',
	className,
	onMenuItemClick,
	onClick,
	'data-cy': dataCy,
	...props
}) => {
	const elementRef = useRef()
	const { isMobile } = useViewport()

	useEffect(() => {
		if (isError && elementRef.current) {
			elementRef.current.focus()
		}
	}, [isError])

	const handleClick = (event) => {
		if (isLink && onMenuItemClick && isMobile) {
			onMenuItemClick()
		}

		if (onClick) {
			onClick(event)
		}
	}

	const combinedClassName = cn(
		isLink && linkClasses,
		isLink && isActive && activeClasses,
		className,
	)

	return (
		<BaseButton
			ref={elementRef}
			className={combinedClassName}
			isLink={isLink}
			to={to}
			isError={isError}
			isDisabled={isDisabled}
			modeType={modeType}
			aria-current={isActive ? 'page' : undefined}
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
	isActive: PropTypes.bool,
	to: PropTypes.string,
	className: PropTypes.string,
	onMenuItemClick: PropTypes.func,
	onClick: PropTypes.func,
	'data-cy': PropTypes.string,
}

export default NavMenuButtonLink
