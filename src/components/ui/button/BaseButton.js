import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import styles from './BaseButton.module.scss';

function BaseButton({
	children,
	isLink = false,
	isError = false,
	isDisabled = false,
	modeType,
	to = '/',
	className,
	...props
}) {
	const elementRef = useRef();

	useEffect(() => {
		if (isError && elementRef.current) {
			elementRef.current.focus();
		}
	}, [isError]);

	const combinedClassName = classNames(className, styles[modeType]);

	return (
		<>
			{!isLink ? (
				<button
					ref={elementRef}
					className={combinedClassName}
					disabled={isDisabled}
					{...props}>
					{children}
				</button>
			) : (
				<a
					href={to}
					ref={elementRef}
					className={combinedClassName}
					aria-disabled={isDisabled}
					{...props}>
					{children}
				</a>
			)}
		</>
	);
}

BaseButton.propTypes = {
	children: PropTypes.node.isRequired,
	isLink: PropTypes.bool,
	isError: PropTypes.bool,
	isDisabled: PropTypes.bool,
	modeType: PropTypes.string,
	to: PropTypes.string,
	className: PropTypes.string,
};

export default BaseButton;
