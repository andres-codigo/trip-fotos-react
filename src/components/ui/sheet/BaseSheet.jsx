import { useRef } from 'react'

import * as RadixDialog from '@radix-ui/react-dialog'
import PropTypes from 'prop-types'

import { SHEET } from '@/constants/test'

import { cn } from '@/utils/cn'

const CloseIcon = () => (
	<svg
		aria-hidden="true"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</svg>
)

const BaseSheet = ({
	container = document.body,
	show,
	title,
	onClose,
	closeLabel = 'Close',
	description,
	footer,
	className,
	'data-cy': dataCy = SHEET.ID,
	children,
}) => {
	// Radix only returns focus to its own Trigger, so the sheet remembers whatever opened it
	const openerRef = useRef(null)

	return (
		<RadixDialog.Root
			open={show}
			onOpenChange={(open) => {
				if (!open) onClose()
			}}>
			<RadixDialog.Portal container={container}>
				<RadixDialog.Overlay
					className="fixed inset-0 z-10 bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
					onClick={onClose}
					data-cy={SHEET.BACKDROP}
				/>
				<RadixDialog.Content
					className={cn(
						'fixed inset-x-0 bottom-0 z-100 flex max-h-[85dvh] flex-col rounded-t-[1.5rem] border border-b-0 border-border-card bg-surface text-text shadow-overlay data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in motion-reduce:data-[state=closed]:animate-fade-out motion-reduce:data-[state=open]:animate-fade-in',
						className,
					)}
					data-cy={dataCy}
					aria-modal="true"
					// Without a description, Radix warns unless aria-describedby is explicitly undefined
					{...(description ? {} : { 'aria-describedby': undefined })}
					// Runs before focus moves into the sheet, so the opener is still focused
					onOpenAutoFocus={() => {
						openerRef.current = document.activeElement
					}}
					onCloseAutoFocus={(e) => {
						e.preventDefault()
						openerRef.current?.focus()
					}}
					// The backdrop's own click handler closes the sheet
					onPointerDownOutside={(e) => e.preventDefault()}
					onInteractOutside={(e) => e.preventDefault()}>
					<div
						aria-hidden="true"
						className="mx-auto mt-2 h-1 w-10 flex-none rounded-pill bg-border-strong"
					/>
					<div className="flex flex-none items-center justify-between gap-2 py-1 pr-1 pl-4">
						<RadixDialog.Title
							className="m-0 text-xl leading-tight font-bold"
							data-cy={SHEET.TITLE}>
							{title}
						</RadixDialog.Title>
						<RadixDialog.Close
							type="button"
							aria-label={closeLabel}
							className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-text hover:bg-surface-accent"
							data-cy={SHEET.CLOSE}>
							<CloseIcon />
						</RadixDialog.Close>
					</div>
					{description && (
						<RadixDialog.Description className="m-0 px-4 text-text-muted">
							{description}
						</RadixDialog.Description>
					)}
					{/* The body takes the remaining height and scrolls, so the header and footer stay in view */}
					<div
						className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
						data-cy={SHEET.BODY}>
						{children}
					</div>
					{footer && (
						<div
							className="flex flex-none items-center gap-2 border-t border-border px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
							data-cy={SHEET.FOOTER}>
							{footer}
						</div>
					)}
				</RadixDialog.Content>
			</RadixDialog.Portal>
		</RadixDialog.Root>
	)
}

BaseSheet.propTypes = {
	container: PropTypes.instanceOf(Element),
	show: PropTypes.bool.isRequired,
	title: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	closeLabel: PropTypes.string,
	description: PropTypes.string,
	footer: PropTypes.node,
	className: PropTypes.string,
	'data-cy': PropTypes.string,
	children: PropTypes.node,
}

export default BaseSheet
