import { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { CSSTransition } from 'react-transition-group'

import BaseButton from '@/components/ui/button/BaseButton'

import baseDialogStyles from './BaseDialog.module.scss'

function BaseDialog({
	children,
	isError = false,
	show,
	title = null,
	sectionClasses = false,
	fixed = false,
	onClose,
	actions,
	header,
}) {
	const nodeRef = useRef(null)
	const [isVisible, setIsVisible] = useState(show)

	useEffect(() => {
		if (show) {
			setIsVisible(true)
		}
	}, [show])

	const tryClose = () => {
		if (!fixed) {
			onClose()
		}
	}

	if (!isVisible && !show) return null

	return ReactDOM.createPortal(
		<>
			{show && (
				<div
					className={baseDialogStyles.backdrop}
					onClick={tryClose}></div>
			)}
			<CSSTransition
				in={show}
				appear={show}
				nodeRef={nodeRef}
				timeout={300}
				classNames={{
					appear: baseDialogStyles['dialog-appear'],
					appearActive: baseDialogStyles['dialog-appear-active'],
					enter: baseDialogStyles['dialog-enter'],
					enterActive: baseDialogStyles['dialog-enter-active'],
					exit: baseDialogStyles['dialog-exit'],
					exitActive: baseDialogStyles['dialog-exit-active'],
				}}
				unmountOnExit>
				<dialog
					ref={nodeRef}
					open
					className={baseDialogStyles.dialog}>
					<header className={baseDialogStyles.header}>
						{header ? header : <h2>{title}</h2>}
					</header>
					<section
						className={
							sectionClasses
								? baseDialogStyles.imageSection
								: baseDialogStyles.generalSection
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
	)
}

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
}

export default BaseDialog
