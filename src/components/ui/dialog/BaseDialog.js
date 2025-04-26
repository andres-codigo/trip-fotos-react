import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { CSSTransition } from 'react-transition-group';

import BaseButton from '@/components/ui/button/BaseButton.js';
import styles from './BaseDialog.module.scss';

const BaseDialog = ({
	children,
	isError = false,
	show,
	title = null,
	sectionClasses = false,
	fixed = false,
	onClose,
	actions,
	header,
}) => {
	const nodeRef = useRef(null);
	const [isVisible, setIsVisible] = useState(show);

	useEffect(() => {
		if (show) {
			setIsVisible(true);
		}
	}, [show]);

	const tryClose = () => {
		if (!fixed) {
			onClose();
		}
	};

	if (!isVisible && !show) return null;

	return ReactDOM.createPortal(
		<>
			{show && <div className={styles.backdrop} onClick={tryClose}></div>}
			<CSSTransition
				in={show}
				appear={show}
				nodeRef={nodeRef}
				timeout={300}
				classNames={{
					appear: styles['dialog-appear'],
					appearActive: styles['dialog-appear-active'],
					enter: styles['dialog-enter'],
					enterActive: styles['dialog-enter-active'],
					exit: styles['dialog-exit'],
					exitActive: styles['dialog-exit-active'],
				}}
				unmountOnExit>
				<dialog ref={nodeRef} open className={styles.dialog}>
					<header className={styles.header}>
						{header ? header : <h2>{title}</h2>}
					</header>
					<section
						className={
							sectionClasses
								? styles.imageSection
								: styles.generalSection
						}>
						{children}
					</section>
					{!fixed && (
						<menu>
							{actions ? (
								actions
							) : (
								<BaseButton
									isError={isError}
									onClick={tryClose}>
									Close
								</BaseButton>
							)}
						</menu>
					)}
				</dialog>
			</CSSTransition>
		</>,
		document.body,
	);
};

BaseDialog.propTypes = {
	children: PropTypes.node,
	isError: PropTypes.bool,
	show: PropTypes.bool.isRequired,
	title: PropTypes.string,
	sectionClasses: PropTypes.bool,
	fixed: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	actions: PropTypes.node,
	header: PropTypes.node,
};

export default BaseDialog;
