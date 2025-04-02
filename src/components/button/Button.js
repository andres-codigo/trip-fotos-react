import { useEffect, useRef } from 'react';
import classNames from 'classnames';

import styles from './Button.module.scss';

function Button({
	children,
	isLink,
	isError,
	isDisabled,
	modeType,
	url,
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
					href={url}
					ref={elementRef}
					className={combinedClassName}
					aria-disabled={isDisabled}>
					{children}
				</a>
			)}
		</>
	);
}

export default Button;
