import { useState, useEffect, useRef, useId } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { CSSTransition } from 'react-transition-group'

import { DIALOG } from '@/constants/test/dialog'

import BaseButton from '@/components/ui/button/BaseButton'

import baseDialogStyles from './BaseDialog.module.scss'

const BaseDialog = ({
	children,
	isError = false,
	show,
	header,
	title = null,
	fixed = false,
	onClose,
	actions,
	sectionClasses = false,
	'data-cy': dataCy,
}) => {
	const titleId = useId()
	const descId = useId()

	const nodeRef = useRef(null)

	/**
	 * shouldRender is used to keep the dialog mounted in the DOM
	 * after show becomes false, allowing exit animations to play.
	 * It is set to true when show is true, and only unmounts when
	 * both shouldRender and show are false.
	 */
	const [shouldRender, setShouldRender] = useState(show)

	useEffect(() => {
		if (show) {
			setShouldRender(true)
		}
	}, [show])

	const tryClose = () => {
		if (!fixed) {
			onClose()
		}
	}

	useEffect(() => {
		if (!show) return

		const handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				onClose?.()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [show, onClose])

	if (!shouldRender && !show) return null

	return ReactDOM.createPortal(
		<>
			{show && (
				<div
					className={baseDialogStyles.backdrop}
					onClick={tryClose}
					data-cy={DIALOG.BACKDROP}></div>
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
					data-cy={dataCy}
					aria-modal="true"
					role={
						isError ? DIALOG.ROLE_ALERTDIALOG : DIALOG.ROLE_DIALOG
					}
					aria-labelledby={titleId}
					aria-describedby={descId}
					tabIndex={-1}>
					<header className={baseDialogStyles.header}>
						{header ? (
							header
						) : (
							<h2
								id={titleId}
								data-cy={DIALOG.TITLE}>
								{title}
							</h2>
						)}
					</header>
					<main
						className={
							sectionClasses
								? baseDialogStyles.image
								: baseDialogStyles.general
						}
						data-cy={DIALOG.TEXT_CONTENT}>
						<div id={descId}>{children}</div>
					</main>
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
	'data-cy': PropTypes.string,
}

export default BaseDialog
