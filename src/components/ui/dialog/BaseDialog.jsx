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
	header,
	title = null,
	fixed = false,
	onClose,
	actions,
	sectionClasses = false,
	dataCypress,
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
					className={baseDialogStyles.dialog}
					data-cy={dataCypress}>
					<header className={baseDialogStyles.header}>
						{header ? header : <h2 data-cy="title">{title}</h2>}
					</header>
					<section
						className={
							sectionClasses
								? baseDialogStyles.imageSection
								: baseDialogStyles.generalSection
						}
						data-cy="text-content">
						{children}
					</section>
					{!fixed && (
						<footer>
							{actions ? (
								actions
							) : (
								<BaseButton
									isError={isError}
									onClick={tryClose}>
									Close
								</BaseButton>
							)}
						</footer>
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
	header: PropTypes.node,
	title: PropTypes.string,
	fixed: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	actions: PropTypes.node,
	sectionClasses: PropTypes.bool,
	dataCypress: PropTypes.string,
}

export default BaseDialog
