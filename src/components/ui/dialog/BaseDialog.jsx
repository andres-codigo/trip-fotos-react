import * as RadixDialog from '@radix-ui/react-dialog'
import PropTypes from 'prop-types'

import { DIALOG } from '@/constants/test'

import BaseButton from '@/components/ui/button/BaseButton'
import { cn } from '@/utils/cn'

const BaseDialog = ({
	container = document.body,
	show,
	header,
	title = null,
	fixed = false,
	onClose,
	actions,
	sectionClasses = false,
	isError = false,
	'data-cy': dataCy,
	children,
}) => {
	const tryClose = () => {
		if (!fixed) {
			onClose()
		}
	}

	return (
		<RadixDialog.Root
			open={show}
			onOpenChange={(open) => {
				if (!open) onClose?.()
			}}>
			<RadixDialog.Portal container={container}>
				<RadixDialog.Overlay
					className="fixed inset-0 z-10 bg-[var(--overlay-backdrop)] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
					onClick={tryClose}
					data-cy={DIALOG.BACKDROP}
				/>
				<RadixDialog.Content
					className="fixed inset-0 z-100 m-auto h-fit outline-none w-4/5 overflow-hidden rounded-lg bg-background shadow-elevated md:w-1/2 data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out"
					data-cy={dataCy}
					aria-modal="true"
					role={
						isError ? DIALOG.ROLE_ALERTDIALOG : DIALOG.ROLE_DIALOG
					}
					// The backdrop's own click handler decides whether to close
					onPointerDownOutside={(e) => e.preventDefault()}
					onInteractOutside={(e) => e.preventDefault()}>
					<div className="w-full bg-accent-foreground p-4 text-primary-foreground">
						{header ? (
							<RadixDialog.Title asChild>
								<div>{header}</div>
							</RadixDialog.Title>
						) : (
							<RadixDialog.Title
								className="m-0 text-[length:1.5em] font-bold"
								data-cy={DIALOG.TITLE}>
								{title}
							</RadixDialog.Title>
						)}
					</div>
					<div
						className={cn(
							sectionClasses
								? 'flex items-center pt-10 pb-4 *:w-full'
								: 'p-4 [&_p]:text-center [&_img]:mx-auto [&_img]:block [&_img]:object-cover [&_img]:p-2.5',
						)}
						data-cy={DIALOG.TEXT_CONTENT}>
						<RadixDialog.Description asChild>
							<div>{children}</div>
						</RadixDialog.Description>
					</div>
					{!fixed && (
						<div className="m-0 flex justify-end gap-2 p-4">
							{actions ? (
								actions
							) : (
								<BaseButton
									isError={isError}
									onClick={tryClose}
									data-cy={DIALOG.BUTTON}>
									Close
								</BaseButton>
							)}
						</div>
					)}
				</RadixDialog.Content>
			</RadixDialog.Portal>
		</RadixDialog.Root>
	)
}

BaseDialog.propTypes = {
	container: PropTypes.instanceOf(Element),
	show: PropTypes.bool.isRequired,
	header: PropTypes.node,
	title: PropTypes.string,
	fixed: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	actions: PropTypes.node,
	sectionClasses: PropTypes.bool,
	isError: PropTypes.bool,
	'data-cy': PropTypes.string,
	children: PropTypes.node,
}

export default BaseDialog
