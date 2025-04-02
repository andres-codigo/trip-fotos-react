import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import styles from './Button.module.scss';

function Button({
	children,
	isLink = false,
	isError = false,
	isDisabled = false,
	modeType,
	to = '/',
	className,
	...rest
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
					{...rest}
					ref={elementRef}
					className={combinedClassName}
					disabled={isDisabled}>
					{children}
				</button>
			) : (
				<a
					{...rest}
					href={to}
					ref={elementRef}
					className={combinedClassName}
					aria-disabled={isDisabled}>
					{children}
				</a>
			)}
		</>
	);
}

Button.propTypes = {
	children: PropTypes.node.isRequired,
	isLink: PropTypes.bool,
	isError: PropTypes.bool,
	isDisabled: PropTypes.bool,
	modeType: PropTypes.string,
	to: PropTypes.string,
	className: PropTypes.string,
};

export default Button;
